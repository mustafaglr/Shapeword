# Shapeword

Türkçe kelime + blok bulmacası (prototip). Harfleri kaydırıp kelime yaz; çizdiğin yol aynı şekilde bir blok olur. Blokları 9×9 tahtaya yerleştir; dolan satır, sütun ve 3×3 kutular patlar.

**Oyna:** https://mustafaglr.github.io/Shapeword/

Telefonda tarayıcıdan açıp "Ana Ekrana Ekle" dersen kendi simgesiyle tam ekran açılır.

## Neler var

- **10 dünya, her birinin kendi engeli ve kuralı:** Orman (kütük), Çöl (sayaçlı akrep), Okyanus (yürüyen yengeç), Volkan (yayılan lav), Buzul (iki darbelik buz), Gece (silikleşen hayalet), Bahar (altın harf veren tomurcuk), Kanyon (zincirleme dinamit), Uzay (jeneratör kalkanlı çekirdek), Boşluk (blok yutan boşluk). 100 bölümden sonra dünyalar daha zor olarak yeniden başlar.
- **Harita:** dünyaların birbirine karıştığı tek bir çizimli arazi. Her 7 bölümde bir Joker bölümü. Geçtiğin bölümlere dönüp yıldız artırabilirsin.
- **Yıldızlar:** hedeflerin hepsi ★★★, %70'i ★★, %40'ı ★.
- **Sesler:** hepsi tarayıcıda üretilir. Kaydırdığın her harf dünyanın gamında bir nota çalar; her engelin kendi sesi, her dünyanın kendi ortam sesi var. Ayarlar'dan kapatılabilir.
- **Rekabet:** haftalık lig, günlük düello (o gün oynamış gerçek bir oyuncu varsa rakip odur), bölüm rekorları, haritada diğer oyuncular.
- **Günlük ödül:** 7 günlük seri.
- **Bulut kaydı:** ilk açılışta ismini sorar; aynı isimle başka cihazdan girersen kaldığın yerden devam edersin (JSONBin; şifre yok, test sürümü).

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html`, `styles.css` | sayfa iskeleti ve görünüm |
| `app.js` | arayüz: ekranlar, kaydırma ve sürükleme, animasyonlar, kayıt, rekabet |
| `core.js` | kurallar: kelime bulma, blok yerleştirme, engeller, bölüm üretimi, sanal oyuncu |
| `scenes.js` | çizimler: dünya manzaraları, harita, engel simgeleri, uygulama simgesi |
| `sounds.js` | ses motoru (WebAudio) |
| `words-tr.js` | Türkçe kelime listesi: yaklaşık 24.000 kabul edilen kelime (sözlük biçimleri ve sık kullanılan çekimli hâller), bunların 3.000'i harf alanına yerleştirilen gündelik kelimeler |
| `build-words-tr.py` | kelime listesini üretir |
| `config.js` | bulut kaydı ayarı (yalnızca okuma/güncelleme yetkili JSONBin Access Key) |
| `docs/` | tasarım kararları |

## Geliştirme

- `node test.js`: her engel kuralı, 300 bölümün tutarlılığı ve sanal oyuncunun yıldız dağılımı.
- `node test.js --calibrate`: hamle sayısı tablosunu yeniden üretir. Bölüm üretimini, bir engel kuralını ya da kelime listesini değiştirdikten sonra çalıştır ve çıktıyı `core.js` içindeki `MOVES` satırına yapıştır.
- `node scenes.js`: çizim üreticisinin kendi kontrolü.
- `python3 -I build-words-tr.py master-dictionary.dict tr_full.txt`: kelime listesini yeniden üretir (iki kaynak dosya depoda tutulmaz, adresleri betiğin başında yazar). Ardından `node test.js --calibrate` çalıştır.

## Kelime kaynakları

- Sözlük biçimleri: [Zemberek-NLP](https://github.com/ahmetaa/zemberek-nlp) sözlüğü (Apache 2.0).
- Sıklık ve çekimli hâllerin doğrulanması: [FrequencyWords](https://github.com/hermitdave/FrequencyWords), OpenSubtitles 2018 sayımları (CC BY-SA 4.0).
- Kelimeler 3–6 harflidir. Çekimli bir hâl, kökü sözlükte varsa ve altyazılarda en az 30 kez geçiyorsa kabul edilir.

Not: düello rakibi (gerçek oyuncu yoksa) ve reklamlar simülasyondur.
