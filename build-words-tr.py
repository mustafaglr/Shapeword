# -*- coding: utf-8 -*-
# Builds words-tr.js from three sources:
#   1. the hand-written everyday words below (always in COMMON: used for grids, hints and the bot),
#   2. an open lexicon for the dictionary forms: Zemberek-NLP master-dictionary.dict (Apache 2.0),
#      github.com/ahmetaa/zemberek-nlp, morphology/src/main/resources/tr/
#   3. word counts from subtitles, to rank the lexicon (frequent ones join COMMON) and to confirm inflected forms:
#      FrequencyWords tr_full.txt (OpenSubtitles 2018, CC BY-SA 4.0), github.com/hermitdave/FrequencyWords, content/2018/tr/
# usage: python3 -I build-words-tr.py master-dictionary.dict tr_full.txt     (the two downloads are not kept in the repo)
import sys, json, random
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

# ---- the wide list ----
ok = lambda w: len(w) > 1 and set(w) <= set(LETTERS)   # also drops proper names, punctuation and entries with spaces
count = {}
for line in open(sys.argv[2], encoding="utf-8"):
    w, _, n = line.rstrip().partition(" ")
    if n.isdigit() and ok(w): count[w] = int(n)
words, stems, odd, inverse = set(), set(), set(), set()   # dictionary forms, verb stems, interjections and sound words, back-vowel words that take front suffixes (saat -> saati)
for line in open(sys.argv[1], encoding="utf-8"):
    w, _, attrs = line.strip().partition(" ")
    w = w.translate(str.maketrans("âîû", "aiu"))
    if not ok(w) or "Abbrv" in attrs: continue
    if w[-3:] in ("mak", "mek") and "P:" not in attrs and len(w) > 4: stems.add(w[:-3])
    if "Interj" in attrs or "P:Dup" in attrs: odd.add(w)
    if "InverseHarmony" in attrs: inverse.add(w)
    words.add(w)
lemmas = {w for w in words if 3 <= len(w) <= 6}

# Inflected forms: build stem + suffix freely, keep only what people really say (it is in the corpus often enough).
V4, V2 = "ıiuü", "ae"
def each(*parts):
    out = [""]
    for part in parts: out = [a + b for a in out for b in part]
    return out
NOUN_SUF = set(sum([
    each("l", V2, "r"), each(V4), each(V2), each("ysn", V4), each("y", V2), each("dt", V2), each("dt", V2, "n"), each(["", "n"], V4, "n"), ["m", "n", "ki"],
    each(V4, "m"), each(["", "y"], "l", V2), each("l", V4), each("s", V4, "z"), each("l", V4, "k"), each("cç", V4), each("cç", V2), each("mn", V4, "z"),
    each("dt", V4), each("dt", V4, "r"), each("yd", V4), each(V4, "mn", V4), each(V4, "mn", V2), each("n", "dt", V2), each("l", V2, "r", V4), each("l", V2, "r", V2)], []))
VERB_SUF = set(sum([
    each("dt", V4), each("dt", V4, "mnk"), ["r"], each(V2 + V4, "r"), each("m", V2), each("m", V2, "zm"), each(["", "y"], V2, "n"), each(["", "y"], V4, "p"),
    each("s", V2), each("s", V2, "mnk"), each(["", "y"], V4, "n"), each("s", V4, "n"), each(["", "y"], V2), each(V2, "l", "ıi", "m"), each("m", V4, "ş"),
    each("m", V2, "k"), each(V2, "c", V2, "k"), each(V4, "yor"), each(V4, "nc", V2), each(V2, "r", V2, "k"), each("m", V2, "l", "ıi"), each(["", "y"], V4, "ş")], []))
def variants(w):   # the stem as suffixes meet it: kitap -> kitab, renk -> reng, ağız -> ağz, hak -> hakk
    out = {w}
    soft = {"p": "b", "ç": "c", "t": "d", "k": "ğ"}.get(w[-1])
    if soft: out.add(w[:-1] + soft)
    if w.endswith("nk"): out.add(w[:-1] + "g")
    if len(w) >= 4 and w[-2] in V4 and w[-1] not in VOWELS and w[-3] not in VOWELS: out.add(w[:-2] + w[-1])
    if len(w) == 3: out.add(w + w[-1])
    return out
SAID = 30   # times in the corpus
said = lambda c: 3 <= len(c) <= 6 and count.get(c, 0) >= SAID
def fits(w, suf):   # vowel harmony, front or back: without it the corpus lets names and typos through (aldin, kima)
    sv = next((ch for ch in suf if ch in VOWELS), None)
    return sv is None or w in inverse or (sv in "eiü") == (last_vowel(w) in FRONT)
TWO = set(SHORT.split()) | set("bu şu su ne kim ben sen biz siz".split())   # two-letter noun stems are only trusted from this list (yo + u is not a word)
inflected = {w for w in stems if said(w)}   # the bare stem is the imperative: gel, bak, yap
for group, sufs in ((words, NOUN_SUF), (stems, VERB_SUF)):
    for w in group:
        if len(w) < 3 and group is words and w not in TWO: continue
        for v in variants(w):
            inflected.update(c for c in (v + s for s in sufs if fits(w, s)) if said(c))
for w in stems:   # de -> diyor, ye -> yiyor
    if w[-1] in V2: inflected.update(c for c in (w[:-1] + v + "yor" for v in V4) if said(c))
accepted |= lemmas | inflected

# Everyday words: the hand-written ones plus the lexicon words heard most; these are planted in grids, hinted and used by the bot.
BLOCK = set("sik siki sikik sikiş sikmek göt piç amcık yarak yarrak orospu kahpe kaltak ibne puşt döl bok boktan sıçmak pezevenk sürtük fahişe taşak kıç meme zenci kokain eroin esrar afyon penis vajina kondom anal seks seksi porno osuruk sperm tecavüz ırz nazi faşist kaka çiş sidik sürtük kancık şırfıntı yosma ırkçı köle idam intihar cinayet katil ceset kanser".split())
EVERYDAY = 700  # times in the corpus
common = sorted(set(base) | {w for w in lemmas if count.get(w, 0) >= EVERYDAY and w not in BLOCK and w not in odd})

# Turkish letter frequencies (approx., per ~0.5%)
FREQ = dict(a=24, e=18, i=17, n=15, r=14, l=12, ı=10, k=9, d=9, m=7, y=7, u=6, t=6, s=6, b=6, o=5, ü=4, ş=4, z=3, g=3, ç=3, h=2, ğ=2, v=2, c=2, ö=2, p=2, f=1)
bag = "".join(ch * n for ch, n in FREQ.items())
rs = random.Random(1)
ranked = sorted(common, key=lambda w: -count.get(w, 0))
print(f"hand-written {len(base)}, lexicon words (3-6 letters) {len(lemmas)}, confirmed inflections {len(inflected - lemmas)}, accepted {len(accepted)}, everyday {len(common)}")
print("everyday, least heard:", " ".join(ranked[-60:]))
print("everyday, random:", " ".join(rs.sample(common, 60)))
print("inflections, random:", " ".join(rs.sample(sorted(inflected - lemmas), 90)))
import re
print("check by eye:", " ".join(w for w in common if re.search("sik|göt|yar+ak|amc|seks|porn|osur|sıç|bok|piç|oros|döl|tecav|ırk|öldür|ölüm|kan$|silah|bomba|uyuştur|sarhoş|içki|bira|şarap|rakı|votka|viski|kumar", w)))
for lo, hi in ((700, 1500), (300, 700)):
    band = sorted(w for w in lemmas if lo <= count.get(w, 0) < hi and w not in BLOCK and w not in odd and w not in base)
    print(f"heard {lo}-{hi} times: {len(band)} words, e.g.", " ".join(rs.sample(band, 45)))
print("lexicon only, random:", " ".join(rs.sample(sorted(lemmas - set(common)), 60)))
for w in "geldi evde kitabı ağzı rengi diyor bakar gider etti gelin olsa bana seni hakkı güzel kedi the you tsim".split(): print(w, w in accepted, end="; ")
print()
with open("words-tr.js", "w") as f:
    f.write("// Turkish word list, generated by build-words-tr.py: dictionary forms from the Zemberek-NLP lexicon (Apache 2.0) and inflected forms confirmed by\n// FrequencyWords counts (OpenSubtitles 2018, CC BY-SA 4.0). DICT_WORDS are accepted; COMMON_WORDS (everyday ones) fill the grids and the hints.\n")
    js = lambda x: json.dumps(x)  # ASCII-only (\\u escapes) so the file decodes the same whatever charset the server sends
    f.write(f'var DICT_WORDS = {js(" ".join(sorted(accepted)))};\nvar COMMON_WORDS = {js(" ".join(common))};\nvar LETTER_BAG = {js(bag)};\nvar PLURAL_S = false;\nvar CATEGORIES = {js({k: v.split() for k, v in CATEGORIES.items()})};\n')
    f.write('if (typeof module !== "undefined") module.exports = { DICT_WORDS, COMMON_WORDS, LETTER_BAG, PLURAL_S, CATEGORIES };\n')
