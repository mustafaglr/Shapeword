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
- **Üç mod:** Renk modunda kelime yok: aynı renkten en az 3 taşı birleştirirsin, çizdiğin yol blok olur. Rahat (varsayılan) o an yazılabilecek üç kelimeyi gösterir. Klasik modda kelimeleri kendin bulursun; rekor ve lig puanı yalnızca Klasik modda yazılır. Mod bölüm kartından seçilir.
- **Günlük ödül:** 7 günlük seri.
- **Jeton ve sandıklar:** 4 saatte bir bedava sandık, her 12 yıldızda yıldız sandığı, dünya, görev, kademe ve lig sandıkları. Jetonla +5 hamle ya da güçlendirici alınır.
- **Günün görevleri:** her gün herkese aynı üç görev; üçü bitince görev sandığı.
- **Galibiyet serisi:** üst üste geçilen her bölüm bir sonrakine özel harfle başlatır (joker, altın, bomba); yarıda bırakmak seriyi bitirir.
- **Meydan okuma ve kupalar:** bir oyuncuya meydan okursun, o da aynı harflerle senin oyununun kaydına karşı oynar. Kazanan 30 kupa alır, kaybeden 10 verir; kupalar kademeyi belirler (Bronz → Efsane). Oyuncular birbirine yalnızca hazır kısa mesaj gönderebilir.
- **Karakter:** varsayılan ismin baş harfi; Ayarlar'dan 10 karakterden biri ya da cihazdan bir fotoğraf seçilebilir. Fotoğraf cihazda 80×80 küçük bir kopyaya çevrilir; yalnızca bu kopya bulut kaydına yazılır ve diğer oyunculara görünür.
- **Bulut kaydı:** ilk açılışta ismini sorar; aynı isimle başka cihazdan girersen kaldığın yerden devam edersin (JSONBin; şifre yok, test sürümü).

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html`, `styles.css` | sayfa iskeleti ve görünüm |
| `app.js` | arayüz: ekranlar, kaydırma ve sürükleme, animasyonlar, kayıt, rekabet |
| `meta.js` | jeton, kupa ve kademe, görev, sandık kuralları ve sayıları |
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
