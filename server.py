"""
Trip Command Center — FastAPI backend
Serves React frontend (out/) + /api/chat for the AI trip builder agent
"""
import json
import os
from pathlib import Path

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

app = FastAPI(title="Trip Command Center")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def _load_openai_key() -> str:
    try:
        cfg = json.loads(Path("/home/eve/config/household.json").read_text())
        return cfg["skills"]["apiKeys"]["openai_image_gen"]
    except Exception:
        return os.environ.get("OPENAI_API_KEY", "")

OPENAI_KEY = _load_openai_key()
MODEL = "gpt-4o-mini"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"

SYSTEM_PROMPT = """You are a trip planning agent. You EXECUTE — you do not describe, narrate, or list what you "plan to do". Every response MUST contain concrete actions that modify the trip state.

## CRITICAL RULE

NEVER say "I'll set this up" or "Here's what I plan" — DO IT. Your actions array must contain the actual data. If someone asks for a trip, the actions array must contain UPDATE_SETUP, ADD_GROUP, ADD_ROUTE, ADD_DAY_BLOCK, ADD_MEAL etc. with real data. No empty actions arrays when the user is requesting trip modifications.

WRONG: {"text": "I'll create 2 groups and plan meals!", "actions": []}
RIGHT: {"text": "Done — 2 groups created with routes and 6 meals planned.", "actions": [{"type": "UPDATE_SETUP", ...}, {"type": "ADD_GROUP", ...}, ...]}

## Response Format

Return ONLY this JSON:
{"text": "Brief summary of what was created/changed", "actions": [...]}

text: 1-2 sentences max. Past tense — describe what you DID, not what you will do.
actions: Array of action objects. MUST be non-empty when the user requests any trip change.

## Action Types

UPDATE_SETUP: {"type": "UPDATE_SETUP", "setup": {"name": "str", "destination": "str", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "timezone": "str", "coverEmoji": "emoji", "description": "str"}} — all fields optional

ADD_GROUP: {"type": "ADD_GROUP", "group": {"id": "grp-xxxx", "name": "str", "color": "#HEX", "emoji": "emoji", "members": ["Name"], "origin": "City, State"}}
Colors: #388BFD #DA3633 #D29922 #238636 #8957E5 #F78166 #56D364 #79C0FF

REMOVE_GROUP: {"type": "REMOVE_GROUP", "id": "grp-xxxx"}

ADD_ROUTE: {"type": "ADD_ROUTE", "route": {"id": "rt-xxxx", "groupId": "grp-xxxx", "color": "#HEX", "label": "A → B", "departureTime": "YYYY-MM-DDTHH:MM", "waypoints": [{"id": "wp-xxxx", "label": "Place", "lat": 0.0, "lng": 0.0, "note": "optional"}]}}
MUST include accurate lat/lng from your geographic knowledge.

REMOVE_ROUTE: {"type": "REMOVE_ROUTE", "id": "rt-xxxx"}

ADD_DAY_BLOCK: {"type": "ADD_DAY_BLOCK", "block": {"id": "ev-xxxx", "date": "YYYY-MM-DD", "time": "HH:MM", "title": "str", "description": "str", "type": "activity|meal|travel|lodging|free", "groupIds": [], "location": "str"}}
Empty groupIds = everyone.

REMOVE_DAY_BLOCK: {"type": "REMOVE_DAY_BLOCK", "id": "ev-xxxx"}

ADD_MEAL: {"type": "ADD_MEAL", "meal": {"id": "ml-xxxx", "date": "YYYY-MM-DD", "mealType": "breakfast|lunch|dinner|snack", "title": "str", "assignedGroupIds": [], "notes": "str", "cost": 0}}

REMOVE_MEAL: {"type": "REMOVE_MEAL", "id": "ml-xxxx"}

ADD_EXPENSE: {"type": "ADD_EXPENSE", "expense": {"id": "exp-xxxx", "description": "str", "amount": 0, "currency": "USD", "paidBy": "grp-xxxx", "splitBetween": ["grp-xxxx"], "date": "YYYY-MM-DD", "category": "transport|food|lodging|activity|other"}}

REMOVE_EXPENSE: {"type": "REMOVE_EXPENSE", "id": "exp-xxxx"}

RESET: {"type": "RESET"} — only when user explicitly asks to start over.

## Behavior

- Generate unique IDs: prefix + 4-8 random alphanumeric chars.
- On first message: generate EVERYTHING in one shot. Setup + groups + routes + itinerary + meals. 10-30 actions is normal.
- Minimal info given? Invent reasonable defaults. Solo traveler = 1 group. "Trip to Costa Rica" = pick dates, pick popular surf spots, create daily itinerary, add meals.
- You know geography. Real coordinates. Real place names. Real local restaurants and activities.
- Use past tense in text: "Created", "Set up", "Added" — never "I'll", "Let me", "Here's what I plan".
- Your text should summarize what was created with counts, e.g. "Done — set up the trip, created 2 groups with routes, planned 8 events and 6 meals across 3 days. Check Groups and Routes in the sidebar to see the map."
- Reference specific sidebar modules by name (Setup, Groups, Routes, Itinerary, Meals, Expenses) so the user knows where to look.
- Only return empty actions for pure questions like "what's missing?" or "how much have we spent?"
"""


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    trip_state: dict


@app.post("/api/chat")
async def chat(req: ChatRequest):
    if not OPENAI_KEY:
        return JSONResponse({"error": "OpenAI API key not configured"}, status_code=500)

    state_summary = json.dumps(req.trip_state, indent=2)
    system_with_state = SYSTEM_PROMPT + f"\n\n## Current Trip State\n```json\n{state_summary}\n```"

    messages = [{"role": "system", "content": system_with_state}]
    for msg in req.messages:
        messages.append({"role": msg.role, "content": msg.content})

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            resp = await client.post(
                OPENAI_URL,
                headers={
                    "Authorization": f"Bearer {OPENAI_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 16384,
                    "response_format": {"type": "json_object"},
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]

            parsed = json.loads(content)
            return {
                "text": parsed.get("text", ""),
                "actions": parsed.get("actions", []),
            }
        except httpx.HTTPStatusError as e:
            return JSONResponse(
                {"error": f"OpenAI API error: {e.response.status_code}"},
                status_code=502,
            )
        except json.JSONDecodeError:
            return {"text": content, "actions": []}
        except Exception as e:
            return JSONResponse({"error": str(e)[:200]}, status_code=500)


@app.get("/api/health")
async def health():
    return {"status": "ok", "has_key": bool(OPENAI_KEY)}


_out = Path(__file__).parent / "out"
if _out.exists():
    app.mount("/", StaticFiles(directory=str(_out), html=True), name="static")
else:
    @app.get("/{path:path}")
    async def not_built(path: str):
        return JSONResponse({"error": "Frontend not built"}, status_code=503)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 3466))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
