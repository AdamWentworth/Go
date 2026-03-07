import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import sys

from PIL import Image


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from utils.image_cache import LocalImagePreviewCache


class LocalImagePreviewCacheTests(unittest.TestCase):
    def test_get_resized_image_returns_none_for_missing_path(self):
        cache = LocalImagePreviewCache()
        self.assertIsNone(cache.get_resized_image("does/not/exist.png", 64))

    def test_get_resized_image_caches_disk_reads(self):
        cache = LocalImagePreviewCache()
        with tempfile.TemporaryDirectory() as temp_dir:
            image_path = Path(temp_dir) / "sample.png"
            Image.new("RGBA", (32, 32), (255, 0, 0, 255)).save(image_path)

            with patch("utils.image_cache.Image.open", wraps=Image.open) as image_open:
                first = cache.get_resized_image(str(image_path), 24)
                second = cache.get_resized_image(str(image_path), 24)

            self.assertEqual(first.size, (24, 24))
            self.assertEqual(second.size, (24, 24))
            self.assertEqual(image_open.call_count, 1)

    def test_get_resized_image_uses_distinct_cache_entries_per_size(self):
        cache = LocalImagePreviewCache()
        with tempfile.TemporaryDirectory() as temp_dir:
            image_path = Path(temp_dir) / "sample.png"
            Image.new("RGBA", (32, 32), (255, 0, 0, 255)).save(image_path)

            small = cache.get_resized_image(str(image_path), 16)
            large = cache.get_resized_image(str(image_path), 48)

            self.assertEqual(small.size, (16, 16))
            self.assertEqual(large.size, (48, 48))

    def test_get_resized_image_invalidates_when_file_changes(self):
        cache = LocalImagePreviewCache()
        with tempfile.TemporaryDirectory() as temp_dir:
            image_path = Path(temp_dir) / "sample.png"
            Image.new("RGBA", (32, 32), (255, 0, 0, 255)).save(image_path)
            cache.get_resized_image(str(image_path), 24)

            Image.new("RGBA", (32, 32), (0, 255, 0, 255)).save(image_path)

            with patch("utils.image_cache.Image.open", wraps=Image.open) as image_open:
                updated = cache.get_resized_image(str(image_path), 24)

            self.assertEqual(updated.size, (24, 24))
            self.assertEqual(image_open.call_count, 1)

    def test_get_placeholder_reuses_cached_template(self):
        cache = LocalImagePreviewCache()
        first = cache.get_placeholder(20, (10, 20, 30, 255))
        second = cache.get_placeholder(20, (10, 20, 30, 255))
        self.assertEqual(first.size, (20, 20))
        self.assertEqual(second.size, (20, 20))
        self.assertIsNot(first, second)


if __name__ == "__main__":
    unittest.main()
