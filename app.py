# app.py
import os
import re
import streamlit as st

try:
    import whisper
    from transformers import pipeline
    import pandas as pd
    import plotly.express as px
except Exception as e:
    st.set_page_config(page_title="Podcast Analyzer - Error", layout="wide")
    st.title("Podcast Analyzer - Initialization error")
    st.error("Failed to import required libraries.")
    st.exception(e)
    raise

st.set_page_config(page_title="🎧 Podcast Summarizer", layout="wide")

# Sidebar setup
st.sidebar.title("🎙️ Podcast Analyzer Controls")
st.sidebar.markdown("Upload and analyze your podcast/audio file below.")
uploaded_file = st.sidebar.file_uploader(
    "Upload Audio File (mp3/wav/m4a/flac)",
    type=["mp3", "wav", "m4a", "flac"]
)

# Main Page Header
st.title("🌍 Multi-Language Podcast Summarizer & Emotion Tracker")
st.markdown("""
This AI-powered application performs:
- 🔊 **Speech-to-Text Transcription** (using OpenAI Whisper)
- 🌐 **Automatic Translation** (multi-language support)
- 🧠 **Summarization** of long podcasts
- 💬 **Sentiment & Emotion Analysis**  
Upload your audio from the sidebar to get started!
""")

def split_text(text, max_length=1000):
    sentences = re.split(r'(?<=[.!?]) +', text)
    chunks = []
    current_chunk = ""
    for sentence in sentences:
        if len(current_chunk) + len(sentence) <= max_length:
            current_chunk += sentence + " "
        else:
            chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

def main():
    if not uploaded_file:
        st.info("👈 Please upload an audio file from the **sidebar** to start the analysis.")
        return

    os.makedirs("audio", exist_ok=True)
    audio_path = os.path.join("audio", uploaded_file.name)
    with open(audio_path, "wb") as f:
        f.write(uploaded_file.read())

    st.audio(audio_path)

    # --- Step 1: Transcription ---
    try:
        with st.spinner("🔊 Transcribing audio with Whisper..."):
            model = whisper.load_model("base")
            result = model.transcribe(audio_path, task="transcribe")
            transcript = result.get("text", "")
            detected_lang = result.get("language", "unknown")
    except Exception as e:
        st.error("Transcription failed. See details below.")
        st.exception(e)
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
                translator_to_en = pipeline("translation", model="Helsinki-NLP/opus-mt-mul-en")
                translated_text = translator_to_en(transcript, max_length=2000)[0]['translation_text']
        except Exception as e:
            st.warning("Translation failed — proceeding with original transcript.")
            st.exception(e)
            translated_text = transcript

    st.text_area("🗣️ English Transcript (for analysis)", translated_text, height=250)

    chunks = split_text(translated_text, max_length=1000)

    # --- Step 3: Summarization ---
    try:
        with st.spinner("🧠 Generating summary..."):
            summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
            summaries = []
            for chunk in chunks:
                if len(chunk.split()) < 30:
                    summaries.append(chunk)
                else:
                    s = summarizer(chunk, max_length=150, min_length=40, do_sample=False)[0]['summary_text']
                    summaries.append(s)
            full_summary = " ".join(summaries)
    except Exception as e:
        st.error("Summarization failed.")
        st.exception(e)
        full_summary = translated_text[:1000]

    st.subheader("📝 Summary (in English)")
    st.write(full_summary)

    # --- Step 4: Translate Summary Back ---
    summary_translated = full_summary
    if detected_lang != "en":
        try:
            with st.spinner("🌐 Translating summary back to original language..."):
                model_name = f"Helsinki-NLP/opus-mt-en-{detected_lang}"
                translator_back = pipeline("translation", model=model_name)
                summary_translated = translator_back(full_summary, max_length=1000)[0]['translation_text']
                st.subheader("📝 Summary (in Original Language)")
                st.write(summary_translated)
        except Exception:
            st.warning("Could not translate summary back to original language; showing English only.")

    # --- Step 5: Sentiment Analysis ---
    try:
        with st.spinner("💬 Analyzing overall sentiment..."):
            sentiment_analyzer = pipeline("sentiment-analysis")
            sentiment_result = sentiment_analyzer(translated_text[:512])[0]
            st.subheader("🔎 Sentiment Analysis")
            st.write(f"**Label:** {sentiment_result['label']}")
            st.write(f"**Confidence:** {round(sentiment_result['score'] * 100, 2)}%")
    except Exception as e:
        st.warning("Sentiment analysis failed.")
        st.exception(e)

    # --- Step 6: Emotion Detection ---
    try:
        with st.spinner("🎭 Detecting emotions per chunk..."):
            emotion_analyzer = pipeline(
                "text-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                return_all_scores=True
            )
            rows = []
            for i, chunk in enumerate(chunks):
                scores = emotion_analyzer(chunk[:512])[0]
                for s in scores:
                    rows.append({"Chunk": f"Chunk {i+1}", "Emotion": s['label'], "Score": s['score']})
            import pandas as pd
            emotion_df = pd.DataFrame(rows)
            st.subheader("🎭 Emotion Analysis (per chunk)")
            st.dataframe(emotion_df.head(50))
            agg = emotion_df.groupby("Emotion")["Score"].mean().reset_index().sort_values("Score", ascending=False)
            fig = px.bar(
                agg, x="Emotion", y="Score",
                title="Average Emotion Scores Across Podcast",
                labels={"Score": "Average Score"}
            )
            st.plotly_chart(fig, use_container_width=True)
    except Exception as e:
        st.warning("Emotion detection failed.")
        st.exception(e)

    # --- Save Outputs ---
    try:
        with open("transcript.txt", "w", encoding="utf-8") as f:
            f.write(transcript)
        with open("summary.txt", "w", encoding="utf-8") as f:
            f.write(summary_translated)
        st.success("✅ All processing complete!")
    except Exception as e:
        st.warning("Saving outputs failed.")
        st.exception(e)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        st.error("An unexpected error occurred.")
        st.exception(e)
