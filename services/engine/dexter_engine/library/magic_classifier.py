# Component: n29 مستورد وفهرسة المكتبة (Magic Bytes Classifier)
"""
File Classifier based on Magic Bytes (file signatures) rather than file extensions.
Protects against false extensions, malformed files, and executable injection.
"""

import os
import zipfile
from typing import Dict, Any, Tuple

# Magic byte signatures
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
JPEG_MAGIC_PREFIX = b"\xff\xd8\xff"
PDF_MAGIC = b"%PDF-"
ZIP_MAGIC = b"PK\x03\x04"
ZIP_EMPTY_MAGIC = b"PK\x05\x06"
ZIP_SPANNED_MAGIC = b"PK\x07\x08"

def classify_file(file_path: str) -> Dict[str, Any]:
    """
    Classifies a file based on header bytes, structural integrity, and content analysis.
    Returns:
        {
            "type": "presentation" | "image" | "document" | "text" | "corrupt" | "unsupported",
            "subtype": str, # e.g. "pptx", "png", "jpeg", "pdf", "markdown", etc.
            "status": "valid" | "corrupt" | "unsupported",
            "error": Optional[str],
            "size": int
        }
    """
    try:
        size = os.path.getsize(file_path)
    except OSError as e:
        return {
            "type": "corrupt",
            "subtype": "unknown",
            "status": "corrupt",
            "error": f"Cannot read file size: {e}",
            "size": 0
        }

    if size == 0:
        return {
            "type": "text",
            "subtype": "empty",
            "status": "valid",
            "error": None,
            "size": 0
        }

    # Read header bytes (first 512 bytes)
    try:
        with open(file_path, "rb") as f:
            header = f.read(512)
    except OSError as e:
        return {
            "type": "corrupt",
            "subtype": "unreadable",
            "status": "corrupt",
            "error": f"Read error: {e}",
            "size": size
        }

    ext = os.path.splitext(file_path)[1].lower()

    # 1. Check for PNG image
    if header.startswith(PNG_MAGIC):
        return {
            "type": "image",
            "subtype": "png",
            "status": "valid",
            "error": None,
            "size": size
        }

    # 2. Check for JPEG image
    if header.startswith(JPEG_MAGIC_PREFIX):
        return {
            "type": "image",
            "subtype": "jpeg",
            "status": "valid",
            "error": None,
            "size": size
        }

    # 3. Check for WebP image (RIFF....WEBP)
    if header.startswith(b"RIFF") and len(header) >= 12 and header[8:12] == b"WEBP":
        return {
            "type": "image",
            "subtype": "webp",
            "status": "valid",
            "error": None,
            "size": size
        }

    # 4. Check for PDF document
    if header.startswith(PDF_MAGIC):
        return {
            "type": "document",
            "subtype": "pdf",
            "status": "valid",
            "error": None,
            "size": size
        }

    # 5. Check for ZIP / PPTX (PK header)
    if header.startswith(ZIP_MAGIC) or header.startswith(ZIP_EMPTY_MAGIC):
        # Verify if it's a valid PPTX presentation
        try:
            with zipfile.ZipFile(file_path, 'r') as zf:
                # Check for bad zip CRC
                bad_crc = zf.testzip()
                if bad_crc is not None:
                    return {
                        "type": "corrupt",
                        "subtype": "pptx" if ext == ".pptx" else "zip",
                        "status": "corrupt",
                        "error": f"CRC corrupted entry: {bad_crc}",
                        "size": size
                    }
                
                namelist = zf.namelist()
                has_content_types = "[Content_Types].xml" in namelist
                has_presentation_xml = any(name.startswith("ppt/presentation") for name in namelist)

                if has_content_types and has_presentation_xml:
                    return {
                        "type": "presentation",
                        "subtype": "pptx",
                        "status": "valid",
                        "error": None,
                        "size": size
                    }
                else:
                    return {
                        "type": "unsupported",
                        "subtype": "zip_archive",
                        "status": "unsupported",
                        "error": "Generic zip archive, not a PPTX presentation",
                        "size": size
                    }
        except zipfile.BadZipFile as bzf:
            return {
                "type": "corrupt",
                "subtype": "pptx" if ext == ".pptx" else "zip",
                "status": "corrupt",
                "error": f"Corrupt zip archive: {bzf}",
                "size": size
            }
        except Exception as e:
            return {
                "type": "corrupt",
                "subtype": "pptx" if ext == ".pptx" else "zip",
                "status": "corrupt",
                "error": f"Archive verification failure: {e}",
                "size": size
            }

    # 6. Check for SVG image (XML with <svg tag)
    if b"<svg" in header or (b"<?xml" in header and b"<svg" in header):
        return {
            "type": "image",
            "subtype": "svg",
            "status": "valid",
            "error": None,
            "size": size
        }

    # 7. Check for Plain Text / Markdown
    # Must not contain null bytes \x00 or unprintable control codes
    if b"\x00" not in header:
        try:
            # Try decoding header as UTF-8
            header.decode("utf-8")
            subtype = "markdown" if ext in (".md", ".markdown") else "text"
            return {
                "type": "text",
                "subtype": subtype,
                "status": "valid",
                "error": None,
                "size": size
            }
        except UnicodeDecodeError:
            pass

    # 8. Otherwise unsupported or binary
    return {
        "type": "unsupported",
        "subtype": ext.lstrip(".") or "binary",
        "status": "unsupported",
        "error": "Unsupported file format or binary executable signature",
        "size": size
    }
