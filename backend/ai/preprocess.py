import io

import numpy as np
from PIL import Image


class ImagePreprocessor:
    def __init__(self, image_size: tuple[int, int] = (128, 128)):
        self.image_size = image_size

    def load_image(self, contents: bytes):
        return Image.open(io.BytesIO(contents)).convert("RGB").resize(self.image_size)

    def to_model_input(self, image):
        # This model was trained on raw 0-255 pixel values, so do not divide by 255.
        img_array = np.array(image, dtype=np.float32)
        return np.expand_dims(img_array, axis=0)

