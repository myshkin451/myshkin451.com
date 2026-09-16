# Image generation prompts

Generated with the built-in image generation tool on 2026-09-17. The original outputs are preserved
as `concept.png` and `assets/dispersion.png`. No third-party website images were copied into these assets.

## Website concept

```text
Use case: ui-mockup.
Create one polished, implementable desktop website screenshot for a Chinese personal website named "Myshkin 451". This is a visual design proposal, not a marketing landing page. Landscape-ish tall composition, around 1440 by 1400 pixels, front-on, no device frame or presentation background. Show the real webpage canvas edge to edge.
The owner liked a dark visual experiment but rejected theatrical slogans, forced personality, over-explained controls, giant outlined headings, decorative English, and too many emphases. Learn from the restrained typography and generous image-led content areas of OpenAI's site and the matter-of-fact information in Paco Coursey's personal site, without copying either brand.
Page background near black #101112. Quiet regular-weight neutral sans-serif typography. White main text, medium gray metadata. Large unboxed areas and precise alignment. Strong visual experience comes from a beautiful work image, not giant copy or dashboard framing.
Top navigation: "Myshkin 451" at left in a modest 19px sans serif. At right just "项目" "文字" "关于". Wide margins, thin or no rules, lots of air.
The main content starts with a large wide artwork image (roughly 2:1 aspect). The artwork is an elegant sculptural loop made of translucent ridged glass with a silver edge, amber and pale-blue refractions, illuminated in a dark studio. Asymmetric folded oval rather than a sphere or an infinite-loop corporate logo. Photorealistic material and subtle fine grain, substantial shadow and black negative space around the object. This single beautiful image dominates the composition. No text on the artwork, no floating controls, no neon tech grid.
Below image: title "色散" at left in restrained 23px type, and small gray metadata "图像 · 2026". Small diagonal arrow to open the work at far right.
Below that, an airy two-column continuation: left, a small landscape thumbnail of a fine pale silver wireframe torus on black with caption "环面" and metadata "交互实验"; right, a simple writing index headed "文字", with just one row "网站重做记录" and date "2026.09.17". No explanatory paragraphs.
Footer: "Myshkin 451" and "设计预览 · 示例内容" in small gray type.
Render the listed Chinese words cleanly and exactly. Do not add any other text, slogans, welcome lines, personality statements, section numbers, stars, icons unrelated to function, badges, gradients behind text, cards with borders, rounded pill buttons, paper textures, serif type, or Anthropic-style branding. A quiet, confident, visually rich personal work page with useful links.
```

## Standalone artwork

Input: `concept.png`, used as the edit target. Output: `assets/dispersion.png`.

```text
Use case: precise-object-edit.
The supplied image is a website mockup. Extract and faithfully recreate ONLY the large glass artwork in its upper hero rectangle as a standalone wide image asset, approximately 2:1 aspect ratio.
Preserve the exact sculptural form, viewing angle, ribbed transparent glass, delicate silver edges, amber reflections on the right and lower left, cool blue reflections through the center, dark studio background, tabletop reflections, and overall lighting/composition from that hero image.
Remove all webpage chrome, labels, Chinese and English text, captions, typography, secondary torus thumbnail, footer, borders, and UI. Fill the entire new canvas with the hero artwork scene. Keep substantial black breathing space around the sculpture and do not cut off any glass edges. No additions, no watermark, no new objects. This is the actual image asset for implementing that same website.
```
