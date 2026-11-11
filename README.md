# Shapeword

Türkçe kelime + blok bulmacası (prototip). Harfleri kaydırıp kelime yaz; çizdiğin yol aynı şekilde bir blok olur. Blokları 9×9 tahtaya yerleştir, satır, sütun ve 3×3 kutuları patlat; taş ve buz kır, kristal topla.

**Oyna:** https://mustafaglr.github.io/Shapeword/

Telefonda tarayıcıdan açıp "Ana Ekrana Ekle" dersen tam ekran açılır.

## Dosyalar
- `index.html` — oyun arayüzü ve animasyonlar
- `core.js` — kurallar: kelime bulma, blok yerleştirme, engeller, sonsuz bölüm üretimi
- `words-tr.js` — Türkçe kelime listesi (prototip; yayından önce lisanslı tam sözlükle değiştirilmeli)
- `test.js` — kural testleri ve hamle sayısı kalibrasyonu: `node test.js`
- `build-words-tr.py` — kelime listesini üretir

Not: ilerleme ve rekorlar sadece o tarayıcıda saklanır; Düello rakibi ve reklamlar simülasyondur.
