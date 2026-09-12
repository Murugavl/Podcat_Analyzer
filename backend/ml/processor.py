# backend/ml/processor.py
import re
import logging

# Logging is configured centrally in backend/main.py; a library module
# shouldn't call logging.basicConfig() itself as an import side effect
# (it silently wins the race against the app's own config and writes to
# whatever the current working directory happens to be).

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

def translate_text(translator, text, max_length=512):
    """Translate text, splitting it to fit the model's positional limit.

    Marian / opus-mt models accept at most 512 input tokens; a longer
    sequence raises "index out of range in self". We tokenise once, walk
    the ids in model-sized windows, and translate each window separately.
    """
    try:
        if not text or not text.strip():
            return ""

        tokenizer = getattr(translator, "tokenizer", None)
        if tokenizer is None:
            result = translator(text, max_length=max_length, truncation=True)
            return result[0]["translation_text"]

        model_max = getattr(tokenizer, "model_max_length", 512) or 512
        if model_max <= 0 or model_max > 100000:  # guard sentinel values
            model_max = 512
        window = max(64, model_max - 16)  # headroom for special tokens

        # The decoder shares the 512-position limit, so the generation
        # length must be clamped too or generation raises the same
        # "index out of range in self".
        gen_max = min(max_length, window)

        ids = tokenizer.encode(text, add_special_tokens=False)
        pieces = []
        for start in range(0, len(ids), window):
            piece = tokenizer.decode(
                ids[start:start + window], skip_special_tokens=True
            )
            if piece.strip():
                pieces.append(piece)
        if not pieces:
            pieces = [text]

        outputs = []
        for piece in pieces:
            result = translator(piece, max_length=gen_max, truncation=True)
            outputs.append(result[0]["translation_text"])
        return " ".join(outputs).strip()
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
                s = summarizer(chunk, max_length=150, min_length=40, do_sample=False, truncation=True)[0]['summary_text']
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
