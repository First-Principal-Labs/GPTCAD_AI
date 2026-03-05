from pathlib import Path

from openai import AsyncOpenAI

from backend.config import settings

_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

_client = AsyncOpenAI(
    base_url=settings.OPENAI_BASE_URL,
    api_key=settings.OPENAI_API_KEY,
)


def _load_prompt(name: str) -> str:
    return (_PROMPTS_DIR / name).read_text()


async def generate_freecad_code(
    user_prompt: str,
    history: list[dict] | None = None,
    system_prompt_name: str = "system_prompt.txt",
) -> str:
    """Send a user prompt to the LLM and return FreeCAD Python code."""
    system = _load_prompt(system_prompt_name)
    messages: list[dict] = [{"role": "system", "content": system}]

    if history:
        messages.extend(history)

    messages.append({"role": "user", "content": user_prompt})

    response = await _client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
        temperature=0.2,
        max_tokens=4096,
    )

    code = response.choices[0].message.content.strip()

    # Strip markdown fences if the model wraps them
    if code.startswith("```"):
        lines = code.split("\n")
        # Remove first and last fence lines
        lines = [l for l in lines if not l.strip().startswith("```")]
        code = "\n".join(lines)

    return code
