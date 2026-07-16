import hashlib
import sys
import tempfile
import unittest
from pathlib import Path


EDITOR_DIR = Path(__file__).resolve().parents[1]
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from utils.catalog_image_url import (
    catalog_image_file_path,
    version_catalog_image_url,
)


class CatalogImageUrlTests(unittest.TestCase):
    def test_local_path_ignores_catalog_cache_version(self):
        resolved = catalog_image_file_path(
            "/repo/assets",
            "/images/mega/mega_150_Y.png?v=old-version",
        )

        self.assertEqual(
            resolved,
            Path("/repo/assets/images/mega/mega_150_Y.png"),
        )

    def test_version_uses_image_content_and_replaces_an_old_query(self):
        content = b"corrected-mega-mewtwo-y"
        expected_digest = hashlib.sha256(content).hexdigest()[:12]

        with tempfile.TemporaryDirectory() as temp_dir:
            image_path = Path(temp_dir) / "mega_150_Y.png"
            image_path.write_bytes(content)

            versioned = version_catalog_image_url(
                "/images/mega/mega_150_Y.png?v=stale",
                image_path,
            )

        self.assertEqual(
            versioned,
            f"/images/mega/mega_150_Y.png?v={expected_digest}",
        )


if __name__ == "__main__":
    unittest.main()
