# Shapeword: dünyaya özel engeller, sesler, rekabet ve zengin harita

Tarih: 2026-11-11. Kullanıcı karar yetkisini Claude'a bıraktı ("tüm kontrol sende"); bu belge verilen kararların kaydıdır ve arka planda çalışan ajanların ortak sözleşmesidir.

## İstek
1. Ses efektleri oluşturulsun, yeni ses fikirleri bulunsun.
2. Engeller haritaya göre değişsin: soğuk dünyada buz kırılsın, sıcak dünyada başka bir işlem olsun; boşluk (void) gibi bilim kurgu dünyaları da olsun.
3. Oyun daha rekabetçi ve daha işlevsel olsun.
4. Manzaralar zenginleşsin, harita güzelleşsin.

Benim seçtiğim varsayımlar: hazır görsel ya da ses dosyası indirilmez, her şey kodla üretilir (telif ve boyut sorunu yok, ücretsiz). Tek oturumda yapılır. Dil Türkçe.

## Dünyalar ve engeller

Bölüm `n` → dünya `floor(n / 10) % 10`. Her dünyanın kendi engeli ve kendi kuralı var.

| # | Dünya | Engel (kod adı) | Kural |
|---|---|---|---|
| 0 | Orman | Kütük (`kutuk`) | 1 darbede kırılır. Öğretici dünya. |
| 1 | Çöl | Akrep (`akrep`) | Üstünde sayaç var (5). Her blok yerleştirmede 1 azalır. 0'a inince sokar: 1 hamle gider, sayaç başa döner. |
| 2 | Okyanus | Yengeç (`yengec`) | Her blok yerleştirmede 1 kare yana yürür; önü doluysa yön değiştirir. |
| 3 | Volkan | Lav (`lav`) | Yanındaki patlamadan etkilenmez: bulunduğu satır, sütun ya da kutu dolmalı. O hamlede hiç lav söndürülmediyse 1 kare yayılır (en fazla 16 kare). Hedef, baştaki lavın iki katını söndürmektir; hepsi sönerse hedef hemen biter. |
| 4 | Buzul | Buz (`buz`) | 2 darbe ister: önce çatlar, sonra kırılır. Hedef darbe sayar. |
| 5 | Gece | Hayalet (`hayalet`) | Bir hamle görünür, bir hamle silikleşir. Silikken darbe almaz. |
| 6 | Bahar | Tomurcuk (`tomurcuk`) | Kırılınca çiçek açar: harf alanındaki bir harf altına döner. |
| 7 | Kanyon | Dinamit (`dinamit`) | Kırılınca çevresindeki 3×3 alanı patlatır; zincirleme olur. |
| 8 | Uzay | Çekirdek (`cekirdek`) ve Jeneratör (`jenerator`) | Tahtada jeneratör varken çekirdekler kalkanlıdır. Hedef çekirdek sayar. |
| 9 | Boşluk | Boşluk (`bosluk`) | Her blok yerleştirmede boşluklardan biri, bitişiğindeki bir oyuncu bloğunu yutar. |

Ortak kural (değişmedi): bir engel, bulunduğu satır, sütun ya da 3×3 kutu dolup patlayınca, bitişiğinde bir patlama olunca ya da bomba harfinin / dinamitin alanına girince darbe alır.

Tur sırası (`Core.place`): bloğu koy → dolan bölgeler ve bomba harfi → darbeleri uygula (zincirleme patlamalar dahil) → engeller hamlesini yapar (yayıl, yürü, silikleş, sayaç, yut) → bu hareketle dolan bölge varsa o da patlar. Rastgelelik yok: sanal oyuncunun hesapladığı sonuç ile oyuncunun gördüğü aynıdır.

Bölüm üretimi: her dünyanın ilk bölümü yalnızca o dünyanın engelini tanıtır. Sonraki bölümler engeli kristal, 5+ harf ve bomba hedefleriyle karıştırır. Her 7 bölümde bir Joker bölümü gelir (bir dünyanın ilk bölümüne denk gelirse atlanır).

Hamle sayıları ölçümle belirlenir: her bölüm için sanal oyuncunun 8 denemedeki 75. yüzdelik kelime sayısı bir tabloda tutulur (`node test.js --calibrate`), oyuncuya bunun üstüne pay verilir (ilk dünyada 1,7 kat, sonra 1,5 ve 1,35 kat). Kristal ya da bomba hedefi açıkken harf alanında o harften her zaman en az bir tane bulunur; hedef şansa kalmaz.

## Sesler (`sounds.js`)

WebAudio ile sentezlenir; ses dosyası yok. Fikirler:
1. **Müzikal kaydırma:** kaydırılan her harf, dünyanın gamındaki bir sonraki notayı çalar; geçerli kelime bir akorla çözülür, geçersiz kelime pes bir sesle düşer.
2. **Dünyanın tınısı ve ortam sesi:** her dünyanın harf çalgısı ve arkada çok kısık bir ortam sesi farklıdır.
3. **Her engelin kendi sesi:** buz çatlar ve şangırdar, lav cızırdar, dinamit patlar, boşluk yutar.
4. **Kombo büyüdükçe ses incelir.**

```
window.Sfx = {
  unlock(),                  // ilk dokunuşta çağrılır; tekrar tekrar çağrılabilir
  set({ sfx, amb }),         // boolean; verilmeyen alan değişmez
  setWorld(k),               // 0..9: harf gamı + tını + ortam sesi
  play(name, a = 0, b = 0),
  ob(kind, action),          // kind: engel kod adı; action: "break" | "hit" | "act"
  NAMES,                     // play() adlarının dizisi
  renderOffline(what, seconds)  // test için: what = "ad" | { name, a, b } | { ob, action } | { amb: k } → Promise<AudioBuffer>
}
```

| `play` adı | a | b | Ne zaman |
|---|---|---|---|
| `tap` | | | herhangi bir düğme |
| `open` | | | kart açıldı |
| `toggle` | | | ayar değişti |
| `letter` | harfin sırası 0–5 | | kaydırırken yeni harf seçildi |
| `letterBack` | kalan harf sayısı | | son harf geri alındı |
| `word` | uzunluk 3–6 | seri 1–5 | kelime kabul edildi |
| `wordBad` | | | geçersiz kelime |
| `gold`, `crystal`, `bombArm` | | | özel harf kelimede kullanıldı |
| `joker` | | | bir harf jokere döndü |
| `blockPop` | | | blok kutuda belirdi |
| `pick`, `place`, `dropBack` | | | blok alındı / yerleşti / kutusuna geri döndü |
| `clear` | patlayan bölge 1–6 | kombo 1–9 | satır, sütun ya da kutu patladı |
| `big` | | | "KOMBO", "MÜTHİŞ" yazısı |
| `boom` | | | bomba harfi patladı |
| `goalTick`, `goalDone` | | | hedef sayacı azaldı / hedef bitti |
| `start` | | | bölüm başladı |
| `win` | yıldız 1–3 | | bölüm bitti |
| `star` | kaçıncı yıldız 1–3 | | yıldız belirdi |
| `fail` | | | hamle bitti ya da yer kalmadı |
| `gift` | | | hediye ya da günlük ödül |
| `booster` | | | güçlendirici kullanıldı |
| `record` | | | bir rekor geçildi |
| `duelTick` | kalan saniye | | düelloda son 10 saniye |
| `duelEnd` | | | süre bitti |

`ob(kind, action)`: `break` her engelde var. `hit`: `buz` (çatladı), `cekirdek` (kalkana çarptı). `act`: `akrep` (soktu), `yengec` (yürüdü), `lav` (yayıldı), `hayalet` (silikleşti ya da belirdi), `bosluk` (yuttu), `cekirdek` (kalkan düştü).

| # | Dünya | Harf çalgısı ve gam | Ortam sesi |
|---|---|---|---|
| 0 | Orman | marimba; do majör pentatonik | hafif rüzgar, ara sıra kuş |
| 1 | Çöl | telli, kısa; re hicaz | kuru rüzgar |
| 2 | Okyanus | su damlası gibi yumuşak sinüs; fa lidyen | dalga |
| 3 | Volkan | koyu, pes; la minör pentatonik | alçak uğultu, çıtırtı |
| 4 | Buzul | cam çan; tiz, tam ton | ince rüzgar, cam tınıları |
| 5 | Gece | müzik kutusu; mi minör pentatonik | cırcır böceği |
| 6 | Bahar | parlak; sol majör | sık kuş sesi, esinti |
| 7 | Kanyon | banjo gibi kısa; la miksolidyen | rüzgar |
| 8 | Uzay | sentez bip; geniş aralıklı | alçak dron |
| 9 | Boşluk | bozuk akortlu, aşağı kayan | karanlık dron |

Kurallar: bağımlılık ve dosya yok; tek global `Sfx`; hiçbir çağrı hata fırlatmaz (AudioContext yoksa sessizce hiçbir şey yapmaz); AudioContext ilk `unlock()` ile kurulur; sayfa gizlenince ortam sesi durur; çıkışta sınırlayıcı var, kırpma olmaz; aynı ad 40 ms içinde iki kez çalmaz; efekt kanalı ~0,5, ortam kanalı ~0,10.

## Manzara ve harita (`scenes.js`)

```
Scenes.WORLDS                       // 10 dünya, yukarıdaki sıra ve adlarla
Scenes.heroSVG(world, W, H, seed?)  // ana ekran ve oyun arka planı; 420×840 ile çağrılır, taşan kısım kırpılır
Scenes.mapHTML(W, H, pts, spans)    // position:relative, W×H bir kutunun içine konacak HTML
Scenes.ICONS                        // { kutuk, akrep, yengec, lav, buz, buzCrack, hayalet, tomurcuk, dinamit, jenerator, cekirdek, bosluk }
                                    // her biri viewBox="0 0 24 24" bir <svg>; tahta karesini doldurur
Scenes.APP_ICON                     // viewBox="0 0 512 512" bir <svg>: uygulama simgesi
```

- `pts`: bölüm düğümlerinin merkezleri `[[x, y], …]`, 1. bölüm en altta. `spans`: `[{ w, top, bottom }]`, alttan üste; `spans[0].bottom === H`, sonuncunun `top === 0`.
- Bölüm düğümlerini (62 px daire), dünya şeritlerini ve oyuncu işaretlerini `app.js` üstüne koyar; çizim bunların altında kalır.
- Dünyalar sınırda birbirine karışır. Her dünyanın büyük bir simge yapısı, kendine özgü yol dokusu, düğüm altlığı ve birkaç hareketli öğesi olur (hareket azaltma ayarında durur).
- Performans: 100+ bölümlük harita (yükseklik ~10.000 px) dilimler halinde üretilir (`content-visibility: auto`); dilim başına en fazla 25 hareketli öğe; üretim 200 ms'nin altında.

## Rekabet

Veri mevcut JSONBin kaydında, oyuncu başına üç yeni alan: `week { id, pts }`, `duel { date, score }`, `streak { last, n }`.

- **Haftalık lig:** puan, o hafta bölümlerde ve düelloda yapılan rekor artışlarının toplamıdır; aynı bölümü tekrar oynayarak şişirilemez. Hafta pazartesi başlar.
- **Günlük düello:** o gün oynamış gerçek bir oyuncu varsa rakip odur (en yüksek puanlı); yoksa simüle rakip.
- **Bölüm rekoru:** bölüm kartında o bölümün rekoru ve sahibi görünür; geçilince bildirim çıkar.
- **Haritada arkadaşlar:** diğer oyuncuların işaretleri bulundukları bölümde durur.
- **Sıralama kartı:** üç sekme: Haftalık, Düello, Yıldız.

## İşlev

- **Ayarlar:** ses, ortam sesi ve titreşim anahtarları (cihazda saklanır).
- **Günlük ödül:** her gün ilk açılışta; 7 günlük döngü, gün atlanırsa 1. günden başlar.
- **Ana ekrana ekleme:** uygulama simgesi ve manifest.

## Dosyalar

`index.html` (kabuk), `styles.css`, `app.js` (arayüz), `core.js` (kurallar), `scenes.js` (çizim), `sounds.js` (ses), `words-tr.js`, `config.js`.

## Test

- `node test.js`: her engel kuralı, 100 bölümün tutarlılığı, sanal oyuncunun yıldız dağılımı.
- Sesler: her ses `OfflineAudioContext` ile üretilir; duyulur düzeyde ve kırpılmamış olmalı.
- Manzaralar: PNG önizlemeleri gözle incelenir.
- Bütün akış: Playwright ile gerçek fare ve dokunma girişi, telefon boyutunda.

## Kapsam dışı

Gerçek hesap ve şifre, hazır ses ya da görsel paketleri, arka plan müziği, istatistik sayfası, mağaza paketi, yeni dil.
