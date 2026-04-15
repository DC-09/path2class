"""
LLM service for the conversational assistant.
Supports Anthropic (Claude) and OpenAI as providers.
Falls back to a rule-based response when no API key is configured.
"""

import logging
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
Sei l'assistente di navigazione Path2Class per il campus universitario.

Il tuo ruolo:
- Guidare l'utente verso la sua destinazione all'interno del campus.
- Spiegare il percorso in modo semplice, con frasi brevi e numerate.
- Rispondere a domande sulla navigazione, l'accessibilità e i servizi del campus.
- Adattare la lingua delle risposte in base alla preferenza dell'utente.

Regole:
1. Basa SEMPRE le tue risposte sui dati di contesto forniti (posizione, percorso, detection). Non inventare informazioni.
2. Se non hai abbastanza informazioni per rispondere, dillo chiaramente e suggerisci un'azione (es. "Prova a inquadrare un cartello vicino a te").
3. Rispondi in modo conciso: massimo 3-4 frasi per risposta, a meno che l'utente chieda più dettaglio.
4. Quando descrivi indicazioni, usa riferimenti visivi concreti ("dopo il distributore automatico", "la porta con la targa blu").
5. Se l'utente ha vincoli di accessibilità, proponi SOLO percorsi accessibili.
6. Non dare informazioni su orari, docenti o contenuti dei corsi a meno che non siano nel contesto.
7. Usa un tono cordiale ma diretto.
8. Rispondi nella lingua indicata nel contesto (it, en, pt, es, ecc.).\
"""


def format_context(context: dict) -> str:
    """Convert structured navigation context to a text block for the LLM."""
    pos = context.get("current_position", {})
    dest = context.get("destination", {})
    steps = context.get("remaining_steps", [])
    dets = context.get("recent_detections", [])
    acc = context.get("accessibility", {})
    lang = context.get("user_language", "it")

    lines = ["[CONTESTO NAVIGAZIONE]"]
    lines.append(f"Posizione attuale: nodo {pos.get('node_id', 'sconosciuto')}, "
                 f"edificio {pos.get('building', '?')}, piano {pos.get('floor', '?')} "
                 f"(confidenza: {int(pos.get('confidence', 0) * 100)}%)")

    if dest.get("node_id"):
        lines.append(f"Destinazione: {dest['node_id']}")

    if steps:
        lines.append("Step rimanenti:")
        for i, s in enumerate(steps, 1):
            lines.append(f"  {i}. {s.get('label', s.get('action', ''))}")

    if dets:
        det_strs = [f"{d.get('class_name', '?')} (conf {d.get('confidence', 0):.0%})" for d in dets]
        lines.append(f"Detection recenti: {', '.join(det_strs)}")

    avoid = acc.get("avoid_stairs", False)
    lines.append(f"Accessibilità: {'evitare scale' if avoid else 'nessun vincolo'}")
    lines.append(f"Lingua: {lang}")

    return "\n".join(lines)


class LLMService:
    def __init__(self):
        self.provider = settings.llm_provider
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.provider == "anthropic" and settings.anthropic_api_key:
            try:
                from anthropic import Anthropic
                self.client = Anthropic(api_key=settings.anthropic_api_key)
                logger.info("Anthropic LLM client initialized")
            except Exception as e:
                logger.warning(f"Failed to init Anthropic client: {e}")
        elif self.provider == "openai" and settings.openai_api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=settings.openai_api_key)
                logger.info("OpenAI LLM client initialized")
            except Exception as e:
                logger.warning(f"Failed to init OpenAI client: {e}")
        else:
            logger.info(
                "No LLM API key configured. "
                "Running in FALLBACK mode — the assistant will provide basic rule-based responses. "
                "Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env to enable full conversational AI."
            )

    async def get_response(self, user_message: str, context: dict) -> str:
        context_text = format_context(context)
        full_message = f"{context_text}\n\n[DOMANDA UTENTE]\n{user_message}"

        if self.client is None:
            return self._fallback_response(user_message, context)

        if self.provider == "anthropic":
            return await self._anthropic_call(full_message)
        elif self.provider == "openai":
            return await self._openai_call(full_message)

        return self._fallback_response(user_message, context)

    async def _anthropic_call(self, message: str) -> str:
        try:
            response = self.client.messages.create(
                model=settings.llm_model,
                max_tokens=400,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": message}],
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            return "Mi dispiace, al momento non riesco a rispondere. Prova a seguire le indicazioni sullo schermo."

    async def _openai_call(self, message: str) -> str:
        try:
            response = self.client.chat.completions.create(
                model=settings.llm_model,
                max_tokens=400,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": message},
                ],
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return "Mi dispiace, al momento non riesco a rispondere. Prova a seguire le indicazioni sullo schermo."

    def _fallback_response(self, user_message: str, context: dict) -> str:
        """Basic rule-based response when no LLM is available."""
        steps = context.get("remaining_steps", [])
        lang = context.get("user_language", "it")

        if not steps:
            if lang == "en":
                return "You seem to have arrived at your destination, or no route has been set yet."
            return "Sembra che tu sia arrivato a destinazione, oppure non hai ancora impostato un percorso."

        # Build a simple step list
        if lang == "en":
            intro = "Here are your next steps:"
            step_lines = [f"{i}. {s.get('label', s.get('action', ''))}" for i, s in enumerate(steps[:4], 1)]
        elif lang == "pt":
            intro = "Aqui estão os próximos passos:"
            step_lines = [f"{i}. {s.get('label', s.get('action', ''))}" for i, s in enumerate(steps[:4], 1)]
        else:
            intro = "Ecco i prossimi passaggi:"
            step_lines = [f"{i}. {s.get('label', s.get('action', ''))}" for i, s in enumerate(steps[:4], 1)]

        return f"{intro}\n" + "\n".join(step_lines)


# Singleton
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
