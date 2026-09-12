# backend/ml/tts.py
"""Offline text-to-speech for the "download audio summary" feature.

Uses pyttsx3, which drives the OS's own speech engine (SAPI5 on Windows,
espeak on Linux, NSSpeechSynthesizer on macOS) — no network call and no
extra model download.
"""
import logging

import pyttsx3

logger = logging.getLogger(__name__)

# pyttsx3 2.99's espeak driver seeds a hardcoded, espeak-ng-style default
# voice id ("gmw/en") on its very first init. Classic espeak (the `espeak`
# apt package used in our Docker image) doesn't recognise that id, so
# pyttsx3.init() always raises ValueError the first time it's called on
# such a system. "default" is a voice name classic espeak does understand.
_LINUX_ESPEAK_FALLBACK_VOICE = "default"


def _init_engine() -> "pyttsx3.Engine":
    try:
        return pyttsx3.init()
    except ValueError:
        try:
            from pyttsx3.drivers import espeak as espeak_driver
        except ImportError:
            raise
        logger.warning(
            "pyttsx3 espeak driver rejected its default voice id; "
            "retrying with '%s'.", _LINUX_ESPEAK_FALLBACK_VOICE
        )
        espeak_driver.EspeakDriver._defaultVoice = _LINUX_ESPEAK_FALLBACK_VOICE
        return pyttsx3.init()


def synthesize_speech(text: str, output_path: str, rate: int = 175) -> None:
    if not text or not text.strip():
        raise ValueError("No text to synthesize.")

    engine = _init_engine()
    try:
        engine.setProperty("rate", rate)
        engine.save_to_file(text, output_path)
        engine.runAndWait()
    finally:
        engine.stop()
