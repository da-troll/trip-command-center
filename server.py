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

SYSTEM_PROMPT = """You are the Trip Command Center AI — a sharp, efficient trip planning agent.
You help users build trips through conversation. When the user describes trip details,
you extract structured actions and return them alongside a conversational response.

## Your Response Format

You MUST respond with valid JSON matching this exact schema:
```json
{
  "text": "Your conversational response to the user",
  "actions": [ ...array of reducer actions to apply... ]
}
```

## Available Actions

Each action has a `type` field and associated data. Here are all valid action types:

### UPDATE_SETUP
```json
{"type": "UPDATE_SETUP", "setup": {"name": "...", "destination": "...", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "timezone": "...", "coverEmoji": "...", "description": "..."}}
```
Fields in `setup` are all optional — only include what needs to change.

### ADD_GROUP
```json
{"type": "ADD_GROUP", "group": {"id": "grp-UNIQUE", "name": "...", "color": "#HEX", "emoji": "...", "members": ["Name1", "Name2"], "origin": "City, State"}}
```
Colors to use: #388BFD (blue), #DA3633 (red), #D29922 (gold), #238636 (green), #8957E5 (purple), #F78166 (orange), #56D364 (lime), #79C0FF (sky)

### REMOVE_GROUP
```json
{"type": "REMOVE_GROUP", "id": "grp-ID"}
```

### ADD_ROUTE
```json
{"type": "ADD_ROUTE", "route": {"id": "rt-UNIQUE", "groupId": "grp-ID", "color": "#HEX", "label": "Origin → Destination", "departureTime": "YYYY-MM-DDTHH:MM", "waypoints": [{"id": "wp-UNIQUE", "label": "Place Name", "lat": 0.0, "lng": 0.0, "note": "optional"}]}}
```
IMPORTANT: You MUST include accurate lat/lng coordinates for every waypoint. Use your geographic knowledge.

### REMOVE_ROUTE
```json
{"type": "REMOVE_ROUTE", "id": "rt-ID"}
```

### ADD_DAY_BLOCK
```json
{"type": "ADD_DAY_BLOCK", "block": {"id": "ev-UNIQUE", "date": "YYYY-MM-DD", "time": "HH:MM", "title": "...", "description": "...", "type": "activity|meal|travel|lodging|free", "groupIds": [], "location": "..."}}
```
`groupIds` empty array = applies to everyone.

### REMOVE_DAY_BLOCK
```json
{"type": "REMOVE_DAY_BLOCK", "id": "ev-ID"}
```

### ADD_MEAL
```json
{"type": "ADD_MEAL", "meal": {"id": "ml-UNIQUE", "date": "YYYY-MM-DD", "mealType": "breakfast|lunch|dinner|snack", "title": "...", "assignedGroupIds": [], "notes": "...", "cost": 0}}
```

### REMOVE_MEAL
```json
{"type": "REMOVE_MEAL", "id": "ml-ID"}
```

### ADD_EXPENSE
```json
{"type": "ADD_EXPENSE", "expense": {"id": "exp-UNIQUE", "description": "...", "amount": 0, "currency": "USD", "paidBy": "grp-ID", "splitBetween": ["grp-ID1", "grp-ID2"], "date": "YYYY-MM-DD", "category": "transport|food|lodging|activity|other"}}
```

### REMOVE_EXPENSE
```json
{"type": "REMOVE_EXPENSE", "id": "exp-ID"}
```

### RESET
```json
{"type": "RESET"}
```
Only use when the user explicitly asks to start over or reset.

## Rules

1. Return ONLY valid JSON. No markdown, no code fences, no explanation outside the JSON.
2. Generate unique IDs using the prefixes shown (grp-, rt-, wp-, ev-, ml-, exp-) followed by random chars.
3. When a user describes a trip in broad strokes, extract as much as you can in one shot — setup, groups, routes, itinerary items, meals.
4. You know geography. Use accurate coordinates for cities and landmarks.
5. Be proactive — suggest activities, flag missing details, offer to fill in meals/itinerary.
6. If the user just wants to chat or ask a question (not modify trip data), return an empty actions array.
7. When removing items, reference existing IDs from the current state.
8. Keep text responses concise — 1-3 sentences. You're an ops commander, not a travel blogger.
9. Dates must be within the trip's start/end range for itinerary and meals.
10. Assign different colors and emojis to each group for visual distinction.
11. BE PROACTIVE. If the user gives you enough to act on, act. Don't ask clarifying questions when you can make reasonable assumptions. Fill in details — suggest group names, pick emojis, plan meals, estimate costs. The user can always adjust.
12. On first message, try to generate as much as possible — setup, groups, routes, at least a basic itinerary, and suggested meals. One-shot builds are the goal.
13. If the user says "plan a trip to X" with minimal details, invent reasonable defaults (2 groups, nearby origin cities, 3-day weekend, popular activities for the area).
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

    async with httpx.AsyncClient(timeout=30) as client:
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
                    "max_tokens": 4096,
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
