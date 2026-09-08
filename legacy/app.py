# app.py
import os
import sys
import uuid
import io
import logging
from functools import lru_cache
import pandas as pd
import plotly.express as px
import whisper
from transformers import pipeline
import processor

# Step 5: Structured Logging
logging.basicConfig(
    filename="podcast_analyzer.log",
    level=logging.ERROR,
    format="%(asctime)s %(levelname)s %(message)s"
)


def is_streamlit_runtime():
    return "streamlit" in sys.modules or "streamlit.runtime" in sys.modules

# Step 1: Model Caching
@lru_cache(maxsize=1)
def get_whisper_model():
    return whisper.load_model("base")

@lru_cache(maxsize=1)
def get_translator_to_en():
    return pipeline("translation", model="Helsinki-NLP/opus-mt-mul-en")

@lru_cache(maxsize=1)
def get_summarizer():
    return pipeline("summarization", model="facebook/bart-large-cnn")

@lru_cache(maxsize=1)
def get_sentiment_analyzer():
    return pipeline("sentiment-analysis")

@lru_cache(maxsize=1)
def get_emotion_analyzer():
    return pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        top_k=None
    )

@lru_cache(maxsize=8)
def get_translator_back(lang_code):
    model_name = f"Helsinki-NLP/opus-mt-en-{lang_code}"
    return pipeline("translation", model=model_name)

def main():
    import streamlit as st

    st.set_page_config(page_title="🎧 Podcast Summarizer", layout="wide")

    whisper_model = get_whisper_model()
    translator_to_en = get_translator_to_en()
    summarizer_model = get_summarizer()
    sentiment_analyzer = get_sentiment_analyzer()
    emotion_analyzer = get_emotion_analyzer()

    st.sidebar.title("🎙️ Podcast Analyzer Controls")
    st.sidebar.markdown("Upload and analyze your podcast/audio file below.")
    uploaded_file = st.sidebar.file_uploader(
        "Upload Audio File (mp3/wav/m4a/flac)",
        type=["mp3", "wav", "m4a", "flac"]
    )

    st.title("🎧 Podcast Summarizer & Emotion Tracker")
    st.markdown("""
    This AI-powered application performs:
    - 🔊 **Speech-to-Text Transcription** (using OpenAI Whisper)
    - 🌐 **Automatic Translation** (multi-language support)
    - 🧠 **Summarization** of long podcasts
    - 💬 **Sentiment & Emotion Analysis**  
    Upload your audio from the sidebar to get started!
    """)

    if not uploaded_file:
        st.info("👈 Please upload an audio file from the **sidebar** to start the analysis.")
        return

    # Step 2: Safe filenames and UUID
    safe_name = f"{uuid.uuid4()}.mp3"
    os.makedirs("audio", exist_ok=True)
    audio_path = os.path.join("audio", safe_name)
    
    try:
        with open(audio_path, "wb") as f:
            f.write(uploaded_file.read())

        st.audio(audio_path)

        # --- Step 1: Transcription ---
        try:
            with st.spinner("🔊 Transcribing audio with Whisper..."):
                transcript, detected_lang = processor.transcribe_audio(whisper_model, audio_path)
        except Exception as e:
            logging.exception(f"Transcription failed for {safe_name}")
            st.error("Transcription failed. Please check the logs.")
            return

        st.success("✅ Transcription complete!")
        st.info(f"🌐 Detected Language: **{detected_lang.upper()}**")
        st.text_area("🗒️ Original Transcript", transcript, height=250)

        if not transcript.strip():
            st.error("Transcript is empty. Check the audio file or re-run transcription.")
            return

        # --- Step 2: Translation ---
        translated_text = transcript
        if detected_lang != "en":
            try:
                with st.spinner("🌍 Translating transcript to English..."):
                    translated_text = processor.translate_text(translator_to_en, transcript)
            except Exception:
                logging.exception(f"Translation to EN failed for {safe_name}")
                st.warning("Translation failed — proceeding with original transcript.")
                translated_text = transcript

        st.text_area("🗣️ English Transcript (for analysis)", translated_text, height=250)

        # --- Step 3: Summarization ---
        try:
            with st.spinner("🧠 Generating summary..."):
                full_summary = processor.summarize_text(summarizer_model, translated_text)
        except Exception:
            logging.exception(f"Summarization failed for {safe_name}")
            st.error("Summarization failed.")
            full_summary = translated_text[:1000]

        st.subheader("📝 Summary (in English)")
        st.write(full_summary)

        # --- Step 4: Translate Summary Back ---
        summary_translated = full_summary
        if detected_lang != "en":
            try:
                with st.spinner("🌐 Translating summary back to original language..."):
                    translator_back = get_translator_back(detected_lang)
                    summary_translated = processor.translate_text(translator_back, full_summary, max_length=1000)
                    st.subheader("📝 Summary (in Original Language)")
                    st.write(summary_translated)
            except Exception:
                logging.exception(f"Translation back to {detected_lang} failed for {safe_name}")
                st.warning("Could not translate summary back to original language; showing English only.")

        # --- Step 5: Sentiment Analysis ---
        try:
            with st.spinner("💬 Analyzing overall sentiment..."):
                sentiment_result = processor.analyze_sentiment(sentiment_analyzer, translated_text)
                st.subheader("🔎 Sentiment Analysis (Aggregated)")
                st.write(f"**Label:** {sentiment_result['label']}")
                st.write(f"**Confidence:** {round(sentiment_result['score'] * 100, 2)}%")
        except Exception:
            logging.exception(f"Sentiment analysis failed for {safe_name}")
            st.warning("Sentiment analysis failed.")

        # --- Step 6: Emotion Detection ---
        try:
            with st.spinner("🎭 Detecting emotions per chunk..."):
                rows = processor.analyze_emotions(emotion_analyzer, translated_text)
                emotion_df = pd.DataFrame(rows)
                st.subheader("🎭 Emotion Analysis (per chunk)")
                st.dataframe(emotion_df.head(50))
                
                if not emotion_df.empty:
                    agg = emotion_df.groupby("Emotion")["Score"].mean().reset_index().sort_values("Score", ascending=False)
                    fig = px.bar(
                        agg, x="Emotion", y="Score",
                        title="Average Emotion Scores Across Podcast",
                        labels={"Score": "Average Score"}
                    )
                    st.plotly_chart(fig, use_container_width=True)
        except Exception:
            logging.exception(f"Emotion detection failed for {safe_name}")
            st.warning("Emotion detection failed.")

        # --- Step 2: Serve via download buttons (Stateless) ---
        st.divider()
        st.subheader("📥 Download Results")
        col1, col2 = st.columns(2)
        
        with col1:
            st.download_button(
                "Download Transcript", 
                data=transcript, 
                file_name="transcript.txt",
                mime="text/plain"
            )
        
        with col2:
            st.download_button(
                "Download Summary", 
                data=summary_translated, 
                file_name="summary.txt",
                mime="text/plain"
            )

        st.success("✅ All processing complete!")

    finally:
        # Step 2: Cleanup after processing
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception as e:
                logging.error(f"Failed to remove temporary file {audio_path}: {e}")

if __name__ == "__main__":
    if not is_streamlit_runtime():
        print("This app must be run with: streamlit run app.py")
    else:
        try:
            main()
        except Exception as e:
            logging.exception("Uncaught exception in main")
            st.error("An unexpected error occurred.")
