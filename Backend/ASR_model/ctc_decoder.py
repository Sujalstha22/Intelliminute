import numpy as np

# ======================
# GREEDY DECODER
# ======================
def ctc_greedy_decode(logits):
    """
    logits: (T, V)
    """
    pred_ids = np.argmax(logits, axis=-1)

    decoded = []
    prev = -1

    for p in pred_ids:
        if p != prev and p != 0:  # remove duplicates + blanks
            decoded.append(p)
        prev = p

    return decoded


# ======================
# BEAM SEARCH (FIXED)
# ======================
def ctc_beam_search(logits, beam_width=3):
    """
    logits: (T, V)
    """
    # 🔥 convert to log probabilities
    logits = logits - np.max(logits, axis=1, keepdims=True)
    log_probs = logits - np.log(np.sum(np.exp(logits), axis=1, keepdims=True) + 1e-9)

    T, V = log_probs.shape

    beams = [([], 0.0)]  # (sequence, log_prob)

    for t in range(T):
        new_beams = []

        for seq, score in beams:
            for v in range(V):
                new_seq = seq + [v]
                new_score = score + log_probs[t, v]

                new_beams.append((new_seq, new_score))

        # keep top beams
        new_beams = sorted(new_beams, key=lambda x: x[1], reverse=True)[:beam_width]
        beams = new_beams

    best_seq = beams[0][0]

    # ======================
    # CTC COLLAPSE
    # ======================
    final = []
    prev = -1
    for p in best_seq:
        if p != prev and p != 0:
            final.append(p)
        prev = p

    return final