from collections.abc import AsyncGenerator
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


def _strip_fences(code: str) -> str:
    """Strip markdown code fences if present."""
    code = code.strip()
    if code.startswith("```"):
        lines = code.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        code = "\n".join(lines)
    return code


def _build_messages(
    user_prompt: str,
    history: list[dict] | None = None,
    system_prompt_name: str = "system_prompt.txt",
) -> list[dict]:
    system = _load_prompt(system_prompt_name)
    messages: list[dict] = [{"role": "system", "content": system}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user_prompt})
    return messages


async def generate_freecad_code(
    user_prompt: str,
    history: list[dict] | None = None,
    system_prompt_name: str = "system_prompt.txt",
) -> str:
    """Send a user prompt to the LLM and return FreeCAD Python code."""
    messages = _build_messages(user_prompt, history, system_prompt_name)

    response = await _client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
        #temperature=0.2,
        #max_tokens=4096,
    )

    return _strip_fences(response.choices[0].message.content.strip())


async def generate_freecad_code_stream(
    user_prompt: str,
    history: list[dict] | None = None,
    system_prompt_name: str = "system_prompt.txt",
) -> AsyncGenerator[str, None]:
    """Stream LLM tokens for FreeCAD code generation. Yields individual tokens."""
    messages = _build_messages(user_prompt, history, system_prompt_name)

    stream = await _client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
        #temperature=0.2,
        #max_tokens=4096,
        stream=True,
    )

    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
