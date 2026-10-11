# Component: n28 مدقق الحركات (Verified effects only)
"""
Verified Animations and Transitions Injector for OpenXML Presentations.
Injects verified transitions (<p:transition>) and timing (<p:timing>) into slide XML.
Strictly disallows unverified effects to prevent file corruption.
"""

import os
import json
from typing import Dict, Any, Optional
from pptx.oxml import parse_xml
from pptx.oxml.ns import nsdecls
from dexter_engine.logging.safe_logger import get_safe_logger

logger = get_safe_logger("n28_anim")

REGISTRY_PATH = os.path.join(os.path.dirname(__file__), "effects_registry.json")

def load_effects_registry() -> Dict[str, Any]:
    if os.path.exists(REGISTRY_PATH):
        with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"transitions": [], "animations": []}

REGISTRY = load_effects_registry()

def is_transition_verified(effect_id: str) -> bool:
    for t in REGISTRY.get("transitions", []):
        if t["effect_id"] == effect_id and t.get("verified") is True:
            return True
    return False

def is_animation_verified(effect_id: str) -> bool:
    for a in REGISTRY.get("animations", []):
        if a["effect_id"] == effect_id and a.get("verified") is True:
            return True
    return False

def apply_slide_transition(slide, effect_id: str = "fade", speed: str = "med") -> bool:
    """
    Injects a verified OpenXML transition node into <p:sld>.
    ISO/IEC 29500-1 §19.5.90 p:transition
    """
    if not is_transition_verified(effect_id):
        logger.warning(f"Transition '{effect_id}' is not in verified registry. Skipping to prevent corruption.")
        return False

    sld = slide._element
    # Remove existing transition if any
    for child in list(sld):
        if child.tag.endswith('transition'):
            sld.remove(child)

    speed_val = speed if speed in ("fast", "med", "slow") else "med"
    if effect_id == "fade":
        transition_xml = f'<p:transition {nsdecls("p")} spd="{speed_val}"><p:fade/></p:transition>'
    elif effect_id == "push":
        transition_xml = f'<p:transition {nsdecls("p")} spd="{speed_val}"><p:push dir="r"/></p:transition>'
    elif effect_id == "wipe":
        transition_xml = f'<p:transition {nsdecls("p")} spd="{speed_val}"><p:wipe dir="l"/></p:transition>'
    else:
        transition_xml = f'<p:transition {nsdecls("p")} spd="{speed_val}"><p:fade/></p:transition>'

    transition_el = parse_xml(transition_xml)
    sld.append(transition_el)
    return True

def apply_shape_entrance_animation(slide, shape_id: int, effect_id: str = "appear") -> bool:
    """
    Injects an entrance timing node into <p:sld> targeting a shape ID.
    ISO/IEC 29500-1 §19.5.86 p:timing
    """
    if not is_animation_verified(effect_id):
        logger.warning(f"Animation effect '{effect_id}' is not in verified registry. Skipping.")
        return False

    sld = slide._element
    # Clean previous timing if any
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
    return True
