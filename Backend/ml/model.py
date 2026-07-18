import os
import re
import math
import joblib
from collections import defaultdict
import numpy as np

# ======================
# PATH SETUP (ROBUST)
# ======================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

VECTORIZER_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "train", "models", "tfidf_vectorizer.pkl"))
CLASSIFIER_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "train", "models", "sentence_classifier.pkl"))

# ======================
# LOAD MODEL (SAFE)
# ======================
MODEL_LOADED = False

try:
    vectorizer = joblib.load(VECTORIZER_PATH)
    classifier = joblib.load(CLASSIFIER_PATH)
    MODEL_LOADED = True
    print("✅ ML model loaded")
except Exception as e:
    print("⚠️ ML model fallback:", e)

# ======================
# CATEGORY KEYWORDS
# Extended with more domain-specific terms for stronger signal
# ======================
CATEGORY_KEYWORDS = {
    "business": [
        "sales", "revenue", "market", "customer", "budget",
        "cost", "growth", "profit", "strategy", "profitability",
        "forecast", "investment", "stakeholder", "quarterly",
        "roi", "kpi", "pipeline", "acquisition", "target", "quota",
        "pricing", "margin", "churn", "conversion", "monetize"
    ],
    "technical": [
        "bug", "error", "api", "server", "database", "deploy",
        "backend", "frontend", "latency", "crash", "pipeline",
        "architecture", "microservice", "cloud", "devops",
        "code", "repository", "branch", "merge", "refactor",
        "testing", "ci", "cd", "docker", "kubernetes", "endpoint",
        "security", "authentication", "performance", "scalability"
    ],
    "academic": [
        "research", "analysis", "model", "study", "experiment",
        "hypothesis", "paper", "thesis", "lecture", "university",
        "dataset", "evaluation", "methodology", "findings", "results",
        "literature", "citation", "peer", "review", "academic",
        "journal", "publication", "statistical", "sample", "variable"
    ],
    "hr": [
        "recruitment", "interview", "hiring", "employee",
        "onboarding", "performance", "salary", "policy",
        "appraisal", "termination", "benefits", "leave",
        "culture", "engagement", "retention", "training",
        "promotion", "compensation", "workforce", "diversity"
    ],
    "legal": [
        "contract", "compliance", "law", "regulation",
        "liability", "agreement", "case", "risk", "policy",
        "clause", "jurisdiction", "litigation", "settlement",
        "intellectual", "property", "trademark", "patent",
        "confidentiality", "breach", "obligation", "indemnity"
    ],
    "healthcare": [
        "patient", "diagnosis", "treatment", "medical",
        "clinic", "hospital", "symptom", "therapy", "doctor",
        "clinical", "prescription", "surgery", "dosage",
        "protocol", "trial", "outcome", "prognosis", "care",
        "procedure", "referral", "specialist", "nursing"
    ],
    "customer_support": [
        "complaint", "ticket", "support", "issue",
        "refund", "escalation", "service", "customer",
        "feedback", "satisfaction", "resolution", "response",
        "priority", "sla", "agent", "query", "resolve",
        "replacement", "compensation", "follow-up"
    ],
    "creative": [
        "design", "marketing", "campaign", "content",
        "branding", "ideation", "brainstorm", "script",
        "production", "media", "creative", "visual",
        "narrative", "audience", "engagement", "concept",
        "copy", "launch", "channel", "message", "persona"
    ],
    "general": []
}

# ======================
# SCORING WEIGHTS BY MEETING TYPE
# This is the core fix: when a specific type is selected,
# dramatically shift weight toward category-aware scoring.
# ======================
SCORING_WEIGHTS = {
    # (ml_weight, tfidf_weight, rule_weight)
    "general":          (0.50, 0.30, 0.20),
    "business":         (0.20, 0.25, 0.55),
    "technical":        (0.20, 0.25, 0.55),
    "academic":         (0.20, 0.25, 0.55),
    "hr":               (0.20, 0.25, 0.55),
    "legal":            (0.20, 0.25, 0.55),
    "healthcare":       (0.20, 0.25, 0.55),
    "customer_support": (0.20, 0.25, 0.55),
    "creative":         (0.20, 0.25, 0.55),
}

ACTION_HINTS = [
    "need to", "should", "must", "will", "plan to", "suggest", "recommend",
    "can you", "could you", "we will", "we should", "review", "update"
]

DECISION_WORDS = [
    "agreed", "decided", "approved", "confirmed", "finalized",
    "resolved", "accepted", "authorized", "endorsed", "ratified",
    "move forward", "go ahead", "proceed with", "implement",
    "adopt", "approve the proposal", "approved the proposal",
    "decision was made", "it was decided", "the team agreed",
    "management agreed", "board approved", "will proceed",
    "will implement", "will launch", "will start", "will begin",
    "will continue", "will allocate", "will hire", "will schedule",
    "consensus", "unanimously agreed", "reached agreement",
    "came to an agreement", "signed off", "green light",
    "approved unanimously", "research direction finalized",
    "methodology approved", "proposal accepted",
    "deployment approved", "migration approved", "release approved",
    "architecture finalized", "bug fix accepted", "policy approved",
    "budget approved", "hiring approved", "training approved"
]

STOP_WORDS = set([
    "the", "and", "is", "in", "to", "of", "we", "you",
    "that", "it", "for", "on", "with"
])

FILLER_WORDS = [
    "um", "uh", "like", "you know", "i mean",
    "basically", "actually", "sort of"
]


# ======================
# CLEANING
# ======================
def clean_transcript(text):
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text)
    return text


# ======================
# SENTENCE SPLITTING
# ======================
def split_into_sentences(text):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if len(sentences) < 3:
        sentences = re.split(r'\b(so|but|and then|because|now)\b', text)
    return [s.strip() for s in sentences if len(s.strip()) > 10]


# ======================
# FILTER BAD SENTENCES
# ======================
def filter_sentences(sentences):
    result = []
    for s in sentences:
        words = s.split()
        if len(words) < 6 or len(words) > 50:
            continue
        unique_ratio = len(set(words)) / len(words)
        if unique_ratio < 0.45:
            continue
        if "you know" in s.lower() or "i mean" in s.lower():
            continue
        result.append(s)
    return result


# ======================
# TF-IDF
# ======================
def compute_tf(words):
    tf = defaultdict(float)
    for w in words:
        tf[w] += 1
    total = len(words)
    for w in tf:
        tf[w] /= total
    return tf


def compute_idf(sentences):
    N = len(sentences)
    word_doc = defaultdict(int)
    for s in sentences:
        for w in set(s.lower().split()):
            if w not in STOP_WORDS:
                word_doc[w] += 1
    return {w: math.log((N + 1) / (df + 1)) + 1 for w, df in word_doc.items()}


def compute_tfidf(tf, idf):
    return {w: tf[w] * idf.get(w, 0) for w in tf}


# ======================
# CATEGORY-AWARE TF-IDF BOOST
#
# FIX: When a meeting type is selected, category keywords get a
# multiplied IDF so they rank higher in the TF-IDF dimension too.
# This makes TF-IDF contribute to type differentiation instead of
# being fully type-agnostic.
# ======================
def boost_idf_for_category(idf, meeting_type, boost_factor=2.5):
    """
    Returns a new idf dict where words in the selected category's
    keyword list are boosted by boost_factor.
    """
    if meeting_type == "general":
        return idf

    category_kws = set(CATEGORY_KEYWORDS.get(meeting_type, []))
    boosted = {}
    for w, score in idf.items():
        if w in category_kws:
            boosted[w] = score * boost_factor
        else:
            boosted[w] = score
    return boosted


# ======================
# RULE-BASED SCORING
#
# FIX: Keyword score now normalizes by sentence length so longer
# sentences don't unfairly dominate. Also raises the per-keyword
# weight to make the type signal actually matter.
# ======================
def rule_score(sentence, index, total, meeting_type):
    words = sentence.lower().split()
    word_count = max(len(words), 1)

    # Position bonus: earlier sentences often carry context
    pos_score = 0.3 if index < total * 0.2 else 0.1

    # Category keyword score — normalized by sentence length
    # so a 5-word sentence with 2 hits beats a 30-word sentence with 2 hits
    keywords = set(CATEGORY_KEYWORDS.get(meeting_type, []))
    keyword_hits = sum(1 for w in words if w in keywords)
    keyword_score = (keyword_hits / word_count) * 3.0  # strong, normalized boost

    # Intent / decision detection
    intent_score = 0.0
    sentence_lower = sentence.lower()
    if any(a in sentence_lower for a in ACTION_HINTS):
        intent_score += 0.7
    if any(d in sentence_lower for d in DECISION_WORDS):
        intent_score += 0.7

    return pos_score + keyword_score + intent_score


# ======================
# FORMAT
# ======================
def format_sentence(s):
    s = s.strip()
    if not s:
        return s
    s = s[0].upper() + s[1:]
    if s[-1] not in ".!?":
        s += "."
    return s


# ======================
# ACTIONS
# ======================
def extract_actions(sentences):
    return [
        format_sentence(s)
        for s in sentences
        if any(a in s.lower() for a in ACTION_HINTS)
    ][:5]


# ======================
# DECISIONS
# ======================
def extract_decisions(sentences):
    return [
        format_sentence(s)
        for s in sentences
        if any(d in s.lower() for d in DECISION_WORDS)
    ]


# ======================
# QUALITY METRICS
# ======================
def calculate_transcript_quality(transcript, sentences):
    words = transcript.lower().split()
    if not words:
        return 0

    total_words = len(words)
    filler_count = sum(1 for w in words if w in FILLER_WORDS)
    filler_ratio = filler_count / total_words
    unique_ratio = len(set(words)) / total_words
    avg_sentence_length = total_words / max(len(sentences), 1)

    score = 100
    score -= filler_ratio * 100
    score -= max(0, (0.45 - unique_ratio)) * 120
    if avg_sentence_length < 5:
        score -= 20

    return max(0, min(100, round(score, 2)))


def calculate_meeting_type_match(transcript, selected_type):
    transcript_words = transcript.lower().split()
    category_scores = {}

    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for w in transcript_words if w in keywords)
        category_scores[category] = score

    strongest_type = max(category_scores, key=category_scores.get)
    strongest_score = category_scores[strongest_type]
    selected_score = category_scores.get(selected_type, 0)

    if strongest_score == 0:
        return 50, strongest_type

    confidence = (selected_score / strongest_score) * 100
    return round(min(confidence, 100), 2), strongest_type


def calculate_summary_confidence(scores):
    if not scores:
        return 0
    values = list(scores.values())
    avg = np.mean(values)
    confidence = avg * 100
    return round(min(confidence, 100), 2)


def generate_warnings(
    transcript_quality,
    meeting_match,
    selected_type,
    detected_type,
    summary_confidence
):
    warnings = []
    if transcript_quality < 60:
        warnings.append(
            "Audio/transcript quality appears low. Results may be less accurate."
        )
    if meeting_match < 50:
        warnings.append(
            f"Selected meeting type '{selected_type}' may be incorrect. "
            f"Detected content is closer to '{detected_type}'."
        )
    if summary_confidence < 55:
        warnings.append(
            "Summary confidence is low due to fragmented meeting content."
        )
    return warnings

# ======================
# MEETING VALIDATION
# ======================

MEETING_INDICATORS = [
    "meeting", "discuss", "agenda", "project", "team",
    "report", "update", "deadline", "schedule", "plan",
    "decision", "action", "review", "client", "budget",
    "proposal", "issue", "task", "follow-up", "minutes"
]

NON_MEETING_PATTERNS = [
    "lyrics", "chorus", "verse", "repeat", "la la",
    "baby", "love you", "dance", "music"
]


def calculate_meeting_validity(transcript, sentences, actions, decisions):

    text = transcript.lower()
    words = text.split()

    # -----------------------
    # 1. Meeting keyword score
    # -----------------------
    meeting_hits = sum(
        1 for w in words if w in MEETING_INDICATORS
    )

    meeting_score = min(meeting_hits * 4, 30)

    # -----------------------
    # 2. Action/decision signal
    # -----------------------
    action_score = min(len(actions) * 10, 25)
    decision_score = min(len(decisions) * 10, 25)

    # -----------------------
    # 3. Sentence diversity
    # -----------------------
    unique_ratio = len(set(words)) / max(len(words), 1)

    diversity_score = unique_ratio * 20

    # -----------------------
    # 4. Repetition penalty
    # -----------------------
    repeated_phrases = 0

    for s in sentences:
        if sentences.count(s) > 1:
            repeated_phrases += 1

    repetition_penalty = min(repeated_phrases * 8, 30)

    # -----------------------
    # 5. Song / lyric penalty
    # -----------------------
    non_meeting_hits = sum(
        1 for p in NON_MEETING_PATTERNS if p in text
    )

    lyric_penalty = non_meeting_hits * 10

    # -----------------------
    # FINAL SCORE
    # -----------------------
    validity = (
        meeting_score +
        action_score +
        decision_score +
        diversity_score
        - repetition_penalty
        - lyric_penalty
    )

    return max(0, min(100, round(validity, 2)))


# ======================
# MAIN PIPELINE
# ======================

def analyze_meeting(transcript, timeline=None, consistency=None, meeting_type="general"):

    transcript = clean_transcript(transcript)
    sentences = split_into_sentences(transcript)
    sentences = filter_sentences(sentences)

    if not sentences:
        return {
            "summary": ["No meaningful content extracted."],
            "key_points": [],
            "action_items": [],
            "decisions": [],
            "participants": ["Unknown"]
        }

    if MODEL_LOADED:
        try:
            X = vectorizer.transform(sentences)
            probs = classifier.predict_proba(X)[:, 1]
            ml_scores = dict(zip(sentences, probs))
        except Exception:
            ml_scores = {}
    else:
        ml_scores = {}

    # ------------------------------------------------------------------
    # TF-IDF  (with category-aware IDF boost)
    # ------------------------------------------------------------------
    words = [w.lower() for w in transcript.split() if w not in STOP_WORDS]
    tf = compute_tf(words)
    idf = compute_idf(sentences)

    idf = boost_idf_for_category(idf, meeting_type)

    tfidf = compute_tfidf(tf, idf)

    # ------------------------------------------------------------------
    # ADAPTIVE SCORING WEIGHTS
    # For a specific meeting type, rule-based (keyword-driven) scoring
    # gets 55% weight instead of 20%.  The generic ML model drops to 20%.
    # ------------------------------------------------------------------
    ml_w, tfidf_w, rule_w = SCORING_WEIGHTS.get(
        meeting_type,
        SCORING_WEIGHTS["general"]
    )

    scores = {}
    for i, s in enumerate(sentences):
        s_words = s.lower().split()

        tfidf_score = (
            sum(tfidf.get(w, 0) for w in s_words)
            / (len(s_words) + 1)
        )

        rule_based = rule_score(s, i, len(sentences), meeting_type)
        ml_score = ml_scores.get(s, 0)

        scores[s] = (
            ml_w   * ml_score   +
            tfidf_w * tfidf_score +
            rule_w  * rule_based
        )

    # ------------------------------------------------------------------
    # RANKING
    # ------------------------------------------------------------------
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    summary    = [format_sentence(s) for s, _ in ranked[:5]]
    key_points = [format_sentence(s) for s, _ in ranked[:7]]

    # ------------------------------------------------------------------
    # QUALITY ANALYSIS
    # ------------------------------------------------------------------
    transcript_quality = calculate_transcript_quality(transcript, sentences)
    meeting_match, detected_type = calculate_meeting_type_match(transcript, meeting_type)
    summary_confidence = calculate_summary_confidence(scores)

    overall_confidence = round(
        0.4 * transcript_quality +
        0.3 * summary_confidence +
        0.3 * meeting_match,
        2
    )

    meeting_validity = calculate_meeting_validity(
    transcript,
    sentences,
    extract_actions(sentences),
    extract_decisions(sentences)
    )
    
    warnings = generate_warnings(
        transcript_quality,
        meeting_match,
        meeting_type,
        detected_type,
        summary_confidence
    )
    
    if meeting_validity < 35:
        return {
            "error": "Meeting summary generation failed.",

            "summary": [
                "Your meeting summary could not be generated due to one or more of the following reasons:",
                "1. The uploaded audio may not contain a real meeting discussion.",
                "2. The audio may be a song, music, or noisy recording.",
                "3. The spoken language may not be fully supported.",
                "4. The audio quality may be too low or unclear.",
                "5. The transcript may not contain enough meaningful meeting content."
            ],
            "key_points": [],
            "action_items": [],
            "decisions": [],
            "participants": [],
            "transcript": "",
            "quality_metrics": {
                "meeting_validity": 0,
                "overall_confidence": 0,
                "transcript_quality": 0,
                "summary_confidence": 0,
                "meeting_type_match": 0,
                "detected_meeting_type": "invalid",
                "warnings": [
                    "Possible non-meeting audio detected."
                ]
            }
        }
    
    # ------------------------------------------------------------------
    # FINAL RESPONSE
    # ------------------------------------------------------------------
    return {
        "summary": summary,
        "key_points": key_points,
        "action_items": extract_actions(sentences),
        "decisions": extract_decisions(sentences),

        "participants": (
            ["Unknown"]
            if not timeline
            else list(set(t["speaker"] for t in timeline))
        ),

        "quality_metrics": {
            "overall_confidence": overall_confidence,
            "transcript_quality": transcript_quality,
            "summary_confidence": summary_confidence,
            "meeting_type_match": meeting_match,
            "detected_meeting_type": detected_type,
            "warnings": warnings
        }
    }