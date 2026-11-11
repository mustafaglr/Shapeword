# Shapeword

Türkçe kelime + blok bulmacası (prototip). Harfleri kaydırıp kelime yaz; çizdiğin yol aynı şekilde bir blok olur. Blokları 9×9 tahtaya yerleştir, satır, sütun ve 3×3 kutuları patlat; taş ve buz kır, kristal topla.

**Oyna:** https://mustafaglr.github.io/Shapeword/

Telefonda tarayıcıdan açıp "Ana Ekrana Ekle" dersen tam ekran açılır.

- İlk açılışta ismini sorar; aynı isimle başka cihazdan girersen kaldığın yerden devam edersin (JSONBin bulut kaydı).
- Harita: her 10 bölümde yeni bir dünya, her 7 bölümde bir Joker bölümü. Geçtiğin bölümlere dönüp yıldızlarını artırabilirsin.
- Yıldızlar: hedeflerin hepsi ★★★, %70'i ★★, %40'ı ★.

## Dosyalar
- `index.html` — oyun arayüzü ve animasyonlar
- `core.js` — kurallar: kelime bulma, blok yerleştirme, engeller, sonsuz bölüm üretimi
- `config.js` — bulut kaydı ayarı (yalnızca okuma/güncelleme yetkili JSONBin Access Key)
- `words-tr.js` — Türkçe kelime listesi (prototip; yayından önce lisanslı tam sözlükle değiştirilmeli)
- `test.js` — kural testleri ve hamle sayısı kalibrasyonu: `node test.js`
- `build-words-tr.py` — kelime listesini üretir

Not: Düello rakibi ve reklamlar simülasyondur. Bulut kaydında giriş/şifre yok, isim yeterli; bu bir test sürümü.
