# Shapeword

Türkçe kelime + blok bulmacası (prototip). Harfleri kaydırıp kelime yaz; çizdiğin yol aynı şekilde bir blok olur. Blokları 9×9 tahtaya yerleştir; dolan satır, sütun ve 3×3 kutular patlar.

**Oyna:** https://mustafaglr.github.io/Shapeword/

Telefonda tarayıcıdan açıp "Ana Ekrana Ekle" dersen kendi simgesiyle tam ekran açılır.

## Neler var

- **10 dünya, her birinin kendi engeli ve kuralı:** Orman (kütük), Çöl (sayaçlı akrep), Okyanus (yürüyen yengeç), Volkan (yayılan lav), Buzul (iki darbelik buz), Gece (silikleşen hayalet), Bahar (altın harf veren tomurcuk), Kanyon (zincirleme dinamit), Uzay (jeneratör kalkanlı çekirdek), Boşluk (blok yutan boşluk). 100 bölümden sonra dünyalar daha zor olarak yeniden başlar.
- **Harita:** dünyaların birbirine karıştığı tek bir çizimli arazi. Her 7 bölümde bir Joker bölümü, her dünyanın son bölümü taçlı Patron bölümü. Geçtiğin bölümlere dönüp yıldız artırabilirsin.
- **Yükselen taş zemin (13. bölümden itibaren):** her 3 hamlede (30. bölümden sonra her 2 hamlede) tahtanın en alttaki boş sırası taşla dolar, 3 boşluk kalır. Sayaç tahtanın sağ alt köşesinde. Taşlar da satır, sütun ve kutu patlayınca gider; yer kalmazsa bölüm biter (kurtarma: en alttaki 2 taş sırası kalkar). Dünyaların ilk iki bölümü ve Joker bölümleri taşsız.
- **Patron bölümü:** her dünyanın 10. bölümü 2 taş sırasıyla başlar, zemin her 2 hamlede yükselir, 3 hamle fazladan verilir.
- **Yıldızlar:** bölümü geçmek için bütün hedefler gerekir. Bir yıldız bitirmek, bir yıldız kendi hamlelerinin beşte birini artırmak (satın alınan hamle sayılmaz), bir yıldız süre içinde bitirmek içindir (hamle başına 12 saniye, Renk modunda 8). Her modda saat çalışır; süre bölümü bitirmez. Joker bölümünde yıldız puana göredir: hedefin %40'ı ★, %70'i ★★, tamamı ★★★. Bölüm kartı üç yıldızın şartını tek satırda yazar, bölüm sonu hangisinin alındığını gösterir.
- **Sesler:** hepsi tarayıcıda üretilir. Ortam sesinin üstünde her dünyanın kendi tonunda sakin bir müzik çalar: 8 saniyede bir değişen yumuşak akorlar ve seyrek müzik kutusu notaları, hafif yankıyla. Kaydırdığın her harf dünyanın gamında bir nota çalar; her engelin kendi sesi, her dünyanın kendi ortam sesi var. Ayarlar'dan ya da oyun içinde ‹ ile açılan Duraklat kartından kapatılabilir.
- **Ekrana sığma:** kısa ekranlarda (Safari çubukları, küçük telefon) harf alanı ve tahta, sayfa kaydırma gerekmeyene kadar küçülür.
- **Duraklat:** oyundaki ‹ artık bölümden atmaz: ses, ortam sesi ve titreşim anahtarları, Devam et ve (uyarıyla) Haritaya dön.
- **Rehber (ilk bölüm):** yeni oyuncunun OYNA'sı kart okutmadan 1. bölümü açar ve bölüm rehberle oynanır (`coach()`, `G.coach`, `prefs.tut` = rehber bitti). Bir el gerçek ekranda sıradaki işi gösterir: parlayan harfleri kaydır (kısa, jokersiz kelime seçilir), bloğu yeşil yere sürükle (`Core.bestSpot`, `.cell.aim`). Gerekmeyen yarı soluklaşır ve tek satır açıklama taşır (`#coachtip`, `#app[data-coach]`). İlk patlamada "İşte bu!" kartıyla çekilir; rehber sürerken saat durur.
- **Yeni engel animasyonu:** animasyonu olan bir hedef ya da engel ilk çıktığı bölümde (her dünyanın ilk bölümü, 3. bölümde kristal, 5. bölümde 5+ harf, 8. bölümde bomba) bölüm açılırken tek başına oynar (`newRule()`, `unseen()`); "Anladım" her an basılabilir, izlemek zorunlu değildir. Cihaz başına bir kez (`prefs.shown`); izlenene kadar bölüm kartında durmaz, sonra oraya ve ? kartına döner. 1. bölümün kütüğünü rehber öğretir.
- **Nasıl oynanır:** 4 resimli adım (Kaydır, Blok olur, Koy patlat, Hedefi bitir); ana ekrandaki düğmede durur, kendiliğinden açılmaz. Oyundaki ? yalnızca o bölümün hedeflerini gösterir.
- **Sade başlangıç:** ilk dünya her seferinde tek yeni şey öğretir, ardından onu tekrar eden bir bölüm gelir (kütük, kütük, kristal, kristal+kütük, 5+ harf, 5+ harf+kristal, joker, bomba, bomba+kristal, patron); ilk 15 bölümde en fazla iki hedef, bomba harfi 8. bölümden önce çıkmaz.
- **Kısa bölüm kartı:** hedefin adı, sayısı ve Başla. Kural metni ya da canlandırma yalnızca o hedefin (ve taş zeminin) ilk çıktığı bölümde görünür; rekor satırı yalnızca Klasik modda ve rekor varsa.
- **Kademeli ana ekran:** başta yalnızca OYNA ve Nasıl oynanır açıktır; sandıklar, görevler ve harita 3. bölümde, düello, sıralama ve mağaza 5. bölümde açılır. Açılmamış düğmeler baştan ekranda durur ama soluk ve kilitlidir; dokununca "Bölüm 3'te açılır" gibi hangi bölümde açılacağını söyler. Açılış bir kez bildirilir ve cihazda açık kalır.
- **Puan da hedef de tahtada kazanılır:** kelime yalnızca blok üretir ve puanını bloğa yazar (3 puan/harf, her altın harf ×2, Hız çarpanı, 5+ harfte +15); elde bloğun değeri görünür. Blok konunca kare başına 1 puan gelir; kelimenin puanı, bloğun kareleri patladıkça kare kare ödenir, üstüne satır bonusu (20 × bölge² × kombo) eklenir. Tahtada kalan ya da elde bekleyen blok puan vermez.
- **Hedefler:** kristal, kristalli kare patlayınca; bomba, bloğu konup patlayınca; 5+ harf, bloğu konunca sayılır. Joker bölümünün puan hedefi yalnızca tahtadaki puanla dolar (hedef: botun hamle başına 55 puanının %75'i; 12 hamlede 500).
- **Hediyeler:** aynı güçlendirici iki kez gelirse tek kutuda +2 görünür.
- **Tahta odaklı oyun:** 3. bölümden itibaren tahta taşlı başlar: 2–4 satır, sütun ya da kutu, kısa bir kelime biçiminde (3–4 bitişik kare) bir boşluk dışında doludur (`rubble`); Joker bölümünde 5 bölge, düelloda 4. Tahta hangi biçimi istediğini ilk hamleden söyler. Blok sürüklenirken, bırakıldığında patlayacak satır, sütun ve kutular sarı yanar. Tahta ekranın büyük yarısıdır (harf alanı %27, tahta %39 yükseklik; Renk modunda %30 / %36). Hamle payı biraz daraldı (botun 1,6 / 1,4 / 1,3 katı).
- **Adlar:** "Seri" yalnızca galibiyet serisidir; hızlı kelime çarpanı "Hız x2", üst üste patlatma "Kombo", günlük giriş "N gün üst üste".
- **Rekabet:** haftalık lig, günlük düello (o gün oynamış gerçek bir oyuncu varsa rakip odur), bölüm rekorları, haritada diğer oyuncular. Sıralama kartında ilk 3 podyumda; Lig sekmesinde bitime kalan süre ve ilk 3'e kalan puan, Kupa sekmesinde Bronz'dan Efsane'ye kupa yolu. Haftayı ilk 3'te bitiren Lig sandığı ve satılmayan Şampiyon çerçevesi kazanır.
- **Mağaza:** jetonla kalıcı alınan 29 hayvan karakter (Kenney, CC0), 13 şapka (taç, büyücü, korsan, kedi kulağı…), 12 şekilli çerçeve (alev, yaprak çelengi, kalpler, buz dikenleri…), 14 harf görünümü ve 10 blok renk paleti. Her gün herkese aynı 3 ürün %30 indirimli. Alınanlar iki cihazın kaydı birleşirken kaybolmaz.
- **Üç mod:** Renk modunda kelime yok: aynı renkten en az 3 taşı birleştirirsin, çizdiğin yol blok olur. Rahat (varsayılan) o an yazılabilecek üç kelimeyi gösterir. Klasik modda kelimeleri kendin bulursun; rekor ve lig puanı yalnızca Klasik modda yazılır. Mod Ayarlar'dan seçilir; bölüm kartında mod seçimi yoktur.
- **Süre (yalnızca Klasik):** bölüm süre tutar ama süre bölümü bitirmeyi engellemez. Yıldızlar yalnızca hedeflere bakar; hamle başına 12 saniyelik sınırın altında kalan her saniye 1 puan süre bonusu verir (rekora ve lig puanına girer). Her bölümün ilk 10'u yıldıza, sonra süreye, sonra puana göre sıralanır.
- **Renk modunda 9×6 alan ve renk körü ayarı:** Renk modu 54 küçük kare taşla oynanır, böylece üstten düşecek taşlar planlanabilir. Ayarlar'daki Renk körü modu, renk görme farklılıklarında ayırt edilen bir palete (Okabe-Ito) geçer ve şekilleri büyütür.
- **Günlük ödül:** 7 günlük seri.
- **Jeton ve sandıklar (bilerek cimri):** bir bölüm en çok 9 jeton verir (yıldız başına 3), güçlendirici vermez; güçlendirici yalnızca Joker bölümünden (ilk geçişte 1, üçüncü yıldızda 1 daha), günlük ödülden (günde 1, 7. gün 2), sandıklardan ve Kombo x5'ten gelir. 8 saatte bir bedava sandık (5–15 jeton), her 30 yıldızda yıldız sandığı, dünya, görev, kademe ve lig sandıkları. Görevler 10–12 jeton. Yeni oyuncu her güçlendiriciden 1 tane ve 50 jetonla başlar. Jetonla +5 hamle (60), kurtarma (40) ya da güçlendirici (50) alınır; yoksa reklam.
- **Günün görevleri:** her gün herkese aynı üç görev; üçü bitince görev sandığı.
- **Galibiyet serisi:** üst üste geçilen her bölüm bir sonrakine özel harfle başlatır (joker, altın, bomba); yarıda bırakmak seriyi bitirir.
- **Meydan okuma ve kupalar:** bir oyuncuya meydan okursun, o da aynı harflerle senin oyununun kaydına karşı oynar. Kazanan 30 kupa alır, kaybeden 10 verir; kupalar kademeyi belirler (Bronz → Efsane). Oyuncular birbirine yalnızca hazır kısa mesaj gönderebilir.
- **Karakter:** varsayılan ismin baş harfi; Ayarlar'dan 10 karakterden biri ya da cihazdan bir fotoğraf seçilebilir. Fotoğraf cihazda 80×80 küçük bir kopyaya çevrilir; yalnızca bu kopya bulut kaydına yazılır ve diğer oyunculara görünür.
- **Bulut kaydı:** ilk açılışta ismini sorar; aynı isimle başka cihazdan girersen kaldığın yerden devam edersin (JSONBin; şifre yok, test sürümü). Bütün oyunu sıfırlamak için bin'e `resetAt` (ms) yazılır: doğum zamanı (`born`) bundan eski oyuncular ve meydan okumalar görünmez, böyle bir oyuncusu olan cihaz kaydını unutup isim ekranına döner.

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
| `looks.js` | çerçeve ve şapka çizimleri (SVG); `node looks.js` her mağaza ürününün çizimi var mı bakar |
| `art/animals/` | hayvan karakter resimleri: Kenney "Animal Pack Remastered" (CC0), 112 px |
| `art/bg/` | oyun ekranı arka planları: Kenney "Background Elements Remastered" (CC0); Gece, Uzay ve Boşluk çizili sahnede kalır |
| `art/fx/` | patlama parıltıları: Kenney "Particle Pack" (CC0), 64 px |
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

Karakter, arka plan ve parıltı resimleri: Kenney.nl ([Animal Pack Remastered](https://kenney.nl/assets/animal-pack-remastered), [Background Elements Remastered](https://kenney.nl/assets/background-elements-remastered), [Particle Pack](https://kenney.nl/assets/particle-pack); CC0, kaynak gösterme zorunlu değil).

Not: düello rakibi (gerçek oyuncu yoksa) ve reklamlar simülasyondur.
