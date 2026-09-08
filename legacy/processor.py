# processor.py
import re
import logging
import os
import uuid

# Configure logging
logging.basicConfig(
    filename="podcast_analyzer.log",
    level=logging.ERROR,
    format="%(asctime)s %(levelname)s %(message)s"
)

def chunk_text(text, max_chars=512, overlap=50):
    """Summarization/Sentiment chunking logic with sliding window."""
    chunks = []
    start = 0
    if not text:
        return chunks
    while start < len(text):
        end = start + max_chars
        chunks.append(text[start:end])
        if end >= len(text):
            break
        start = end - overlap
    return chunks

def transcribe_audio(model, audio_path):
    try:
        result = model.transcribe(audio_path, task="transcribe")
        return result.get("text", ""), result.get("language", "unknown")
    except Exception:
        logging.exception("Error during transcription")
        raise

def translate_text(translator, text, max_length=2000):
    try:
        # For long texts, we might need to chunk it for the translator as well
        # but the requirement didn't explicitly ask for translation chunking, 
        # only sentiment. However, pipelines have limits.
        # Keeping it simple for now as per instructions.
        result = translator(text, max_length=max_length)
        return result[0]['translation_text']
    except Exception:
        logging.exception("Error during translation")
        raise

def summarize_text(summarizer, text, max_chunk_chars=1000):
    try:
        # Simple splitting for summarization chunks (sentences preferred)
        sentences = re.split(r'(?<=[.!?]) +', text)
        chunks = []
        current_chunk = ""
        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= max_chunk_chars:
                current_chunk += sentence + " "
            else:
                chunks.append(current_chunk.strip())
                current_chunk = sentence + " "
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        summaries = []
        for chunk in chunks:
            if len(chunk.split()) < 30:
                summaries.append(chunk)
            else:
                s = summarizer(chunk, max_length=150, min_length=40, do_sample=False)[0]['summary_text']
                summaries.append(s)
        return " ".join(summaries)
    except Exception:
        logging.exception("Error during summarization")
        raise

def analyze_sentiment(sentiment_analyzer, text):
    try:
        chunks = chunk_text(text, max_chars=512, overlap=50)
        scores = []
        labels = []
        for chunk in chunks:
            result = sentiment_analyzer(chunk)[0]
            # Map sentiment to a numeric value for averaging if possible, 
            # or just aggregate labels. 
            # Requirements say "Run sentiment on all chunks and aggregate the scores"
            # Standard sentiment-analysis returns 'POSITIVE'/'NEGATIVE' and a score.
            labels.append(result['label'])
            scores.append(result['score'])
        
        # Simple aggregation: Most frequent label and average score for that label?
        # Or just average everything if they are same label.
        from collections import Counter
        most_common_label = Counter(labels).most_common(1)[0][0]
        
        avg_score = sum(s for l, s in zip(labels, scores) if l == most_common_label) / labels.count(most_common_label)
        
        return {
            'label': most_common_label,
            'score': avg_score
        }
    except Exception:
        logging.exception("Error during sentiment analysis")
        raise

def analyze_emotions(emotion_analyzer, text):
    try:
        chunks = chunk_text(text, max_chars=512, overlap=50)
        rows = []
        for i, chunk in enumerate(chunks):
            scores = emotion_analyzer(chunk)[0]
            for s in scores:
                rows.append({"Chunk": f"Chunk {i+1}", "Emotion": s['label'], "Score": s['score']})
        return rows
    except Exception:
        logging.exception("Error during emotion analysis")
        raise
