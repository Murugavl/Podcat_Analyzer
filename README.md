# 🎧 Multi-Language Podcast Analyzer & Summarizer

A **Streamlit-based AI-powered application** to analyze podcasts and audio files.  
This tool can **transcribe**, **summarize**, **translate**, **analyze sentiment**, and **detect emotions** in multiple languages.

---

## 🌟 Features

- **Audio Transcription** using **OpenAI Whisper**
- **Multi-Language Support** with automatic translation to/from English
- **Summarization** of long podcasts
- **Sentiment Analysis** (positive, negative, neutral)
- **Emotion Detection** (joy, sadness, anger, fear, etc.)
- **Interactive Dashboard** with visual charts using **Plotly**
- Supports common audio formats: `mp3`, `wav`, `m4a`, `flac`

---

## 🛠️ Technologies Used

- **Python 3.12+**
- [Streamlit](https://streamlit.io/) – Web app framework
- [Whisper](https://github.com/openai/whisper) – Speech-to-text transcription
- [Transformers](https://huggingface.co/transformers/) – NLP for summarization, translation, sentiment, and emotion
- [Plotly](https://plotly.com/python/) – Interactive visualizations
- [Pandas](https://pandas.pydata.org/) – Data processing

---

## ⚡ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/podcast-analyzer.git
cd podcast-analyzer
```
2. Create a virtual environment and activate it
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the Streamlit app:
```bash
streamlit run app.py
```
## 🖥️ Usage

 1. Open the app in your browser (Streamlit will provide the local URL).

 2. Upload your podcast/audio file from the sidebar.

 3. View the transcript, summary, sentiment, and emotion analysis on the main page.

 4. Download transcript.txt and summary.txt automatically saved in the project folder.

## 📁 File Structure
    podcast-analyzer/
    ├─ .gitignore
    ├─ README.md
    ├─ requirements.txt
    ├─ app.py
    ├─ audio/               # Uploaded audio files
    ├─ transcript.txt       # Generated transcript
    ├─ summary.txt          # Generated summary

## ⚠️ Notes

* Large audio files may take longer to process.

* Emotion detection and summarization use chunking to handle long transcripts.

* Make sure ffmpeg is installed for Whisper to process audio correctly.
