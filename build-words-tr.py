# -*- coding: utf-8 -*-
# Builds words-tr.js: hand-written everyday Turkish words (COMMON, used for grids and hints)
# plus regular inflections (plural, locative, dative, accusative) that are also accepted (DICT).
import re, json
BASE = """
ada ağa ağı ahu akı ala alt ama ana ant ara arı ark arz ası aşı aşk ata ayı aza bal bas baş bay bel ben bey bez bin bir bit boş boy boz buz cam can cep cin çam çan çay çek çit çok çöl çöp dağ dal dam dar dev dik dil diş diz dua dul düz ece ela fal far fen fil fiş gaz gel gem gen göl göz gök gül gün güz hak hal han hat hız hoş huy ırk ısı iki ilk kaç kan kap kar kas kaş kat kaz kel kep kil kin kir koç kol kor kot koy köy köz kul kum kur kuş kut kül küp laf lif lig maç mal mat mil mum nal nar naz nem not oba oda ora ova oya ölü pak pas pay pek pil pul raf ray rol ruh saç saf sağ sal sap sar sat saz sel sen ses sır sis siz son soy söz suç süt şah şal şan şef şey şiş şok şut tak tam tan tas taş tat tay tek tel ten ter tez tok ton top toz tuş tuz tüp tür tüy ulu üst üye var ver yağ yak yan yap yar yas yaş yat yay yaz yel yem yer yol yüz yük zar zil zor
bak bil çal çık dur git gör kal kes koş oku öde sev sil sor tut uyu düş kır dön sus sür bul anla başla bekle dinle söyle oyna uyan yürü
almak atmak bakmak gelmek gitmek olmak okumak yazmak sevmek içmek demek etmek kalmak koşmak sormak tutmak uçmak binmek bilmek görmek vermek düşmek dönmek satmak yapmak yatmak açmak çekmek sürmek kesmek silmek bulmak susmak
ağaç ağız ağrı ahır ahşap akıl akşam alan alet alev alın altın anne anı araba arka arsa arzu asker aslan aşçı ateş avcı avlu ayak ayna ayran ayva bacak badem bahar bahçe bakır bakkal balık balkon bant bardak barış basın başak bavul bebek beden bekçi beyaz beyin bıçak bilet bina bitki boğaz borç boya boyun bulut burun bölge böcek börek böbrek bulgur cadde ceket ceviz cevap ceza çaba çadır çakal çamur çanta çarşı çatal çatı çayır çekiç çelik çene çeşme çeyrek çiçek çiftçi çilek çimen çizgi çocuk çorap çorba dalga damla dans davet dayı dede defter değer deniz deri derin ders dert destek devlet dilek direk doğa doktor dolap dost dolu duman duvar duygu dünya düğme düğün eğitim ekin ekmek ekran elbise elma emek emir enerji erik erkek eser eşek eşya etek evlat evren eylem ezgi fare fayda fikir film fırın fırça fiyat fincan futbol gazete gece gelin gemi genç giysi gölge gönül gözlük gömlek gurur güneş güç gülüş gümüş güven hafta hala halı hamur harf harita hasta hava havuç havlu hayal hayat hayvan hazine hece hediye hikaye horoz huzur ırmak ışık iğne ilaç ilçe ilgi ilke imza inek insan inci isim istek işçi izin kabak kadın kafa kafes kahve kalem kalp kamp kanat kanal kapı karga kardeş karın kaşık katır kavun kaya kaygı kazan kedi kelime kemer kemik kent kepçe kese kılıç kış kitap koca koku kolay koltuk komşu konak konu kova koyun köpek köprü kök kumaş kurt kuru kutu kuzu kural kuyu kuzey küpe kürek lale lamba leylek liman lokma macun madde maden makas mama mantar masa masal mavi maymun melek mektup mermer meslek mevsim meyve mide mimar mısır mutfak mutlu müzik nane nehir nine nokta okul olay ordu orman otel oyun ödev ödül öğle öğün ölçü önlük örnek örtü özgür pamuk para pasta pazar perde peri pide pilav pınar plaj puan radyo resim renk rüya rüzgar saat sabah sabun sağlık sahil sahne sakal salata salı saman sanat sandık satır savaş sayfa sayı sebze sefer sehpa selam sepet sevgi sevinç sıcak sıfır sıra sınav sınıf sınır simit sinek soba soğan sokak soru spor sucuk sulu sürü şehir şeker şarkı şapka şiir şirket şişe şimşek tabak tablo tahta takım tarla tarih tatil tava tavan tavuk tavşan taze tekne tepe terzi tohum toprak tren tuzak türkü uçak umut uyku uzay ücret ülke ünlü üzüm vazo vatan vakit veda yağmur yaprak yarış yastık yatak yayla yazar yemek yengeç yıl yıldız yolcu yorgan yoğurt yurt yürek yüzük zaman zarf zeki zeytin zincir zırh
acı açık ağır akıllı alçak aynı bayat bol büyük cesur çirkin çabuk dolu eski geniş güzel hızlı iyi ince kalın kara kısa kirli kötü küçük mor nazik sarı sert soğuk tatlı temiz tuzlu uzun yakın yalnız yaşlı yavaş yeni yeşil zayıf zengin gri pembe siyah hafif sağlam sakin şirin tembel dürüst
abla amca teyze oğul kız baba torun kişi halk aile okur düşman hoca polis pilot garson kral prens sultan cadı ejder
kulak omuz parmak tırnak göğüs bel topuk kirpik dudak
peynir reçel köfte kebap döner lokum helva armut muz kiraz karpuz incir limon biber marul nohut pirinç un sirke şerbet kola
keçi ördek hindi kaplan tilki geyik zürafa yılan yunus balina deve domuz sincap kirpi timsah kartal baykuş serçe
vadi kum kaya gök ışık mevsim
banyo salon kilit baca kapak
otobüs motor taksi tünel durak şoför pusula
silgi cetvel cümle hesap gol kazanç zafer korku öfke neşe hüzün adalet bilgi zeka sabır başarı şans kader gizem
dükkan market banka kart paket kargo posta kamera takvim haber dergi roman konser
"""

# Level categories: every word is 3-6 letters; they are added to the base list so they are always accepted
CATEGORIES = {
 "Hayvanlar": "kedi köpek aslan kaplan ayı kurt tilki tavşan geyik fil zürafa maymun yılan yunus balina deve inek koyun keçi kartal baykuş karga serçe ördek horoz tavuk arı sinek böcek sincap kirpi timsah eşek fare katır kuzu domuz hindi kaz",
 "Yiyecek": "ekmek peynir zeytin bal reçel süt çay kahve pilav çorba salata köfte kebap döner pide börek simit lokum helva elma armut muz kiraz erik çilek karpuz kavun üzüm incir nar limon havuç biber marul soğan nohut pirinç şeker tuz yağ ayran sucuk yoğurt mantı tatlı pasta kek bulgur",
 "Doğa": "ağaç çiçek yaprak dal kök tohum orman dağ tepe ova vadi nehir göl deniz ada kum taş kaya toprak çamur ateş rüzgar bulut yağmur kar sis şimşek güneş yıldız gök dünya uzay ışık gölge çimen ırmak pınar yayla",
 "Ev": "kapı duvar tavan oda mutfak banyo salon balkon bahçe masa koltuk yatak dolap raf halı perde lamba ayna saat tabak bardak kaşık çatal bıçak tava fırın ocak sabun havlu yastık yorgan kilit çatı baca kutu şişe kova sehpa soba vazo",
 "Vücut": "baş saç göz kulak burun ağız dil diş boyun omuz kol parmak tırnak göğüs karın bel bacak diz ayak topuk kalp kan kemik deri yüz kaş kirpik dudak çene alın beyin mide böbrek",
 "Meslek": "doktor polis asker pilot aşçı garson şoför terzi hoca mimar yazar avcı bekçi çiftçi işçi kral berber kasap avukat hakim dişçi çoban boyacı kaptan ressam şair",
 "Ulaşım": "araba otobüs tren uçak gemi tekne motor taksi yol köprü tünel liman durak bilet yolcu kamyon vapur metro kayık sal roket balon",
 "Duygu": "sevgi aşk korku öfke neşe hüzün umut gurur huzur özlem kaygı sevinç utanç merak şefkat nefret keder sabır hayal",
 "Renk": "mavi sarı yeşil mor pembe siyah beyaz gri kahve bej kızıl ela lila bordo krem altın gümüş",
 "Spor": "futbol tenis golf yüzme koşu güreş boks kayak sörf eskrim judo karate maç gol top file kale hakem takım kupa rekor",
}
SHORT = "ev el at ot ok iş su ad ay ağ an iz et un"  # too short to play, but their inflections are words
LETTERS = "abcçdefgğhıijklmnoöprsştuüvyz"
for name, ws in CATEGORIES.items():
    for w in ws.split(): assert 3 <= len(w) <= 6 and set(w) <= set(LETTERS), (name, w)
base = sorted({w for w in (BASE + " " + " ".join(CATEGORIES.values())).split() if 3 <= len(w) <= 6 and set(w) <= set(LETTERS)})
FRONT, VOWELS = set("eiöü"), set("aeıioöuü")
def last_vowel(w):
    for ch in reversed(w):
        if ch in VOWELS: return ch
def forms(w):
    v = last_vowel(w)
    if not v: return []
    front, ends_vowel = v in FRONT, w[-1] in VOWELS
    out = [w + ("ler" if front else "lar"), w + ("t" if w[-1] in "fstkçşhp" else "d") + ("e" if front else "a")]
    if w[-1] not in "pçtk":  # those soften (kitap -> kitabı); skip rather than accept wrong forms
        y = "y" if ends_vowel else ""
        out.append(w + y + ("e" if front else "a"))
        out.append(w + y + {"a": "ı", "ı": "ı", "e": "i", "i": "i", "o": "u", "u": "u", "ö": "ü", "ü": "ü"}[v])
    return out
accepted = set(base)
for w in base + SHORT.split():
    accepted.update(f for f in forms(w) if 3 <= len(f) <= 6)
# Turkish letter frequencies (approx., per ~0.5%)
FREQ = dict(a=24, e=18, i=17, n=15, r=14, l=12, ı=10, k=9, d=9, m=7, y=7, u=6, t=6, s=6, b=6, o=5, ü=4, ş=4, z=3, g=3, ç=3, h=2, ğ=2, v=2, c=2, ö=2, p=2, f=1)
bag = "".join(ch * n for ch, n in FREQ.items())
print(f"base {len(base)} words, accepted with inflections {len(accepted)}; samples: {sorted(forms('kedi') + forms('kitap') + forms('su'))}")
with open("words-tr.js", "w") as f:
    f.write("// Turkish prototype word list: hand-written everyday words + regular inflections. Replace with a licensed full lexicon before launch.\n")
    js = lambda x: json.dumps(x)  # ASCII-only (\\u escapes) so the file decodes the same whatever charset the server sends
    f.write(f'var DICT_WORDS = {js(" ".join(sorted(accepted)))};\nvar COMMON_WORDS = {js(" ".join(base))};\nvar LETTER_BAG = {js(bag)};\nvar PLURAL_S = false;\nvar CATEGORIES = {js({k: v.split() for k, v in CATEGORIES.items()})};\n')
    f.write('if (typeof module !== "undefined") module.exports = { DICT_WORDS, COMMON_WORDS, LETTER_BAG, PLURAL_S, CATEGORIES };\n')
