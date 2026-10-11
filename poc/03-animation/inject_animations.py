#!/usr/bin/env python3
# Component: n28 مدقق الحركات (Verified effects only) & n27 مصدّر PPTX
"""
PoC-03: Demonstrates safe, verified OOXML injection for:
1. Slide Transition: Fade (<p:transition><p:fade/></p:transition>)
2. Element Animation: Entrance Appear (<p:timing>) linked to shape target ID.
3. Automated inspection of the OOXML tree and package integrity.
"""

import os
import zipfile
import xml.etree.ElementTree as ET
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml import parse_xml
from pptx.oxml.ns import nsdecls

def inject_fade_transition(slide, speed="med"):
    """
    Injects a verified Fade transition into the slide root element (<p:sld>).
    ISO/IEC 29500-1 §19.5.90 p:transition
    """
    sld = slide._element
    # Remove existing transition if any
    for child in list(sld):
        if child.tag.endswith('transition'):
            sld.remove(child)

    transition_xml = f'<p:transition {nsdecls("p")} spd="{speed}"><p:fade/></p:transition>'
    transition_el = parse_xml(transition_xml)
    sld.append(transition_el)

def inject_appear_animation(slide, shape_id: int):
    """
    Injects an entrance Appear animation targeting a specific shape ID.
    ISO/IEC 29500-1 §19.5.86 p:timing
    """
    sld = slide._element
    # Remove existing timing if any
    for child in list(sld):
        if child.tag.endswith('timing'):
            sld.remove(child)

    timing_xml = f"""
    <p:timing {nsdecls("p")}>
      <p:tnLst>
        <p:par>
          <p:cTn id="1" dur="indefinite" restart="always" nodeType="tmRoot">
            <p:childTnLst>
              <p:seq concurrent="1" nextAc="seek">
                <p:cTn id="2" dur="indefinite" nodeType="mainSeq">
                  <p:childTnLst>
                    <p:par>
                      <p:cTn id="3" fill="hold">
                        <p:stCondLst>
                          <p:cond delay="0"/>
                        </p:stCondLst>
                        <p:childTnLst>
                          <p:par>
                            <p:cTn id="4" fill="hold">
                              <p:stCondLst>
                                <p:cond delay="0"/>
                              </p:stCondLst>
                              <p:childTnLst>
                                <p:set>
                                  <p:cBhvr>
                                    <p:cTn id="5" dur="1" fill="hold"/>
                                    <p:tgtEl>
                                      <p:spTgt spid="{shape_id}"/>
                                    </p:tgtEl>
                                    <p:attrNameLst>
                                      <p:attrName>style.visibility</p:attrName>
                                    </p:attrNameLst>
                                  </p:cBhvr>
                                  <p:to>
                                    <p:strVal val="visible"/>
                                  </p:to>
                                </p:set>
                              </p:childTnLst>
                            </p:cTn>
                          </p:par>
                        </p:childTnLst>
                      </p:cTn>
                    </p:par>
                  </p:childTnLst>
                </p:cTn>
                <p:prevCondLst>
                  <p:cond evt="onPrev" delay="0">
                    <p:tgtEl>
                      <p:sldTgt/>
                    </p:tgtEl>
                  </p:cond>
                </p:prevCondLst>
                <p:nextCondLst>
                  <p:cond evt="onNext" delay="0">
                    <p:tgtEl>
                      <p:sldTgt/>
                    </p:tgtEl>
                  </p:cond>
                </p:nextCondLst>
              </p:seq>
            </p:childTnLst>
          </p:cTn>
        </p:par>
      </p:tnLst>
    </p:timing>
    """
    timing_el = parse_xml(timing_xml.strip())
    sld.append(timing_el)

def run_poc_animation(output_path: str):
    print("=== [PoC-03] OOXML Animation & Transition Injection ===")
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_layout)

    # Add animated callout shape
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(3.0), Inches(2.5), Inches(7.333), Inches(2.5)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(30, 41, 59)
    shape.line.color.rgb = RGBColor(99, 102, 241)
    shape.line.width = Pt(3)

    tf = shape.text_frame
    p = tf.paragraphs[0]
    p.text = "هذا العنصر يحمل حركة ظهور (Appear) وانتقال شريحة (Fade)"
    p.font.name = "Cairo"
    p.font.size = Pt(22)
    p.font.color.rgb = RGBColor(255, 255, 255)

    target_shape_id = shape.shape_id
    print(f"Target Shape ID: {target_shape_id}")

    # Inject Transition & Animation
    inject_fade_transition(slide, speed="med")
    inject_appear_animation(slide, target_shape_id)

    # Save
    prs.save(output_path)
    print(f"[OK] Saved presentation with animations to: {output_path}")

def verify_animation_xml(output_path: str):
    """Directly unzips the generated PPTX package and validates the OOXML structure."""
    print("=== Verifying Slide OOXML for Injected Nodes ===")
    
    with zipfile.ZipFile(output_path, 'r') as z:
        # List slide files
        slide_files = [f for f in z.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
        assert len(slide_files) > 0, "No slides found in PPTX package!"
        
        slide_xml_bytes = z.read(slide_files[0])
        root = ET.fromstring(slide_xml_bytes)

        # XML namespace map
        namespaces = {
            'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
            'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'
        }

        # 1. Verify Transition
        transition_nodes = root.findall('p:transition', namespaces)
        assert len(transition_nodes) == 1, "Missing or duplicate <p:transition> node!"
        fade_nodes = transition_nodes[0].findall('p:fade', namespaces)
        assert len(fade_nodes) == 1, "Missing <p:fade> inside <p:transition>!"
        print("PASS: Verified <p:transition><p:fade/> node in OOXML.")

        # 2. Verify Timing & Animation
        timing_nodes = root.findall('p:timing', namespaces)
        assert len(timing_nodes) == 1, "Missing or duplicate <p:timing> node!"
        
        # Verify shape target in timing
        sp_targets = root.findall('.//p:spTgt', namespaces)
        assert len(sp_targets) >= 1, "Missing <p:spTgt> shape target inside timing sequence!"
        target_id_attr = sp_targets[0].attrib.get('spid')
        print(f"PASS: Verified <p:timing> node with target spid='{target_id_attr}'.")

    # 3. Verify python-pptx can re-read without corruption
    reopened = Presentation(output_path)
    assert len(reopened.slides) == 1
    print("PASS: Presentation opens cleanly in python-pptx without XML parser corruption.")
    print("=== [PoC-03] RESULT: SUCCESS (Verified OOXML animations and transitions) ===\n")

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    target_pptx = os.path.join(out_dir, "dexter_poc03_animated.pptx")
    run_poc_animation(target_pptx)
    verify_animation_xml(target_pptx)
