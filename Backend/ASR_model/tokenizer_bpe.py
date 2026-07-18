import collections

class BPETokenizer:
    def __init__(self):
        self.vocab = {}
        self.inv_vocab = {}
        self.blank_token = "<blank>"

    def build_vocab(self, texts):
        chars = set()
        for t in texts:
            chars.update(list(t.lower()))

        chars = sorted(list(chars))
        self.vocab = {c: i+1 for i, c in enumerate(chars)}
        self.vocab[self.blank_token] = 0

        self.inv_vocab = {i: c for c, i in self.vocab.items()}

    def encode(self, text):
        return [self.vocab.get(c, 0) for c in text.lower()]

    def decode(self, ids):
        return "".join([self.inv_vocab.get(i, "") for i in ids if i != 0])