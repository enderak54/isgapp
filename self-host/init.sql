--
-- PostgreSQL database dump
--



-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';












--
-- Name: generate_risk_suggestions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_risk_suggestions() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    inserted_count INTEGER := 0;
    r_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO r_count FROM personel 
    WHERE isg_egitim_tarihi IS NOT NULL 
      AND isg_egitim_tarihi < NOW() - INTERVAL '1 year';
    
    IF r_count > 0 THEN
        INSERT INTO ai_risk_suggestions (suggestion_type, title, description, severity, source_table, related_module)
        VALUES ('egitim', 'Egitim suresi dolan personel', 
                r_count || ' personelin ISG egitim suresi dolmus veya dolmak uzere.',
                CASE WHEN r_count > 5 THEN 'kritik' WHEN r_count > 2 THEN 'uyari' ELSE 'bilgi' END,
                'personel', 'egitimler');
        inserted_count := inserted_count + 1;
    END IF;

    SELECT COUNT(*) INTO r_count FROM risk_degerlendirme
    WHERE risk_seviyesi IN ('yuksek', 'kabul_edilemez') AND durum = 'aktif';
    
    IF r_count > 0 THEN
        INSERT INTO ai_risk_suggestions (suggestion_type, title, description, severity, source_table, related_module)
        VALUES ('risk_onleme', 'Yuksek riskli degerlendirmeler',
                r_count || ' adet yuksek/kabul edilemez risk bulunuyor.',
                'kritik', 'risk_degerlendirme', 'risk');
        inserted_count := inserted_count + 1;
    END IF;

    RETURN inserted_count;
END;
$$;


--
-- Name: log_encryption_key_audit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_encryption_key_audit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO audit_log (table_name, action_type, record_id, old_data, new_data)
    VALUES ('encryption_keys', TG_OP, COALESCE(NEW.id, OLD.id), 
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END);
    RETURN COALESCE(NEW, OLD);
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: acil_durum; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.acil_durum (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_adi text NOT NULL,
    senaryo_tipi text NOT NULL,
    senaryo_aciklama text,
    etki_alani text,
    risk_seviyesi text DEFAULT 'orta'::text,
    onleyici_onlemler text,
    mudahale_proseduru text,
    tahliye_plani text,
    acil_durum_ekibi text[],
    iletisim_bilgileri text,
    ekipman_listesi text,
    son_tatbikat_tarihi date,
    sonraki_tatbikat_tarihi date,
    tatbikat_sonucu text,
    durum text DEFAULT 'aktif'::text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT acil_durum_durum_check CHECK ((durum = ANY (ARRAY['aktif'::text, 'gozden_geciriliyor'::text, 'pasif'::text]))),
    CONSTRAINT acil_durum_risk_seviyesi_check CHECK ((risk_seviyesi = ANY (ARRAY['dusuk'::text, 'orta'::text, 'yuksek'::text, 'kritik'::text]))),
    CONSTRAINT acil_durum_senaryo_tipi_check CHECK ((senaryo_tipi = ANY (ARRAY['yangin'::text, 'deprem'::text, 'sel'::text, 'kimyasal_dokulme'::text, 'patlama'::text, 'elektrik_carpma'::text, 'gocekme'::text, 'diger'::text])))
);


--
-- Name: ai_risk_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_risk_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    suggestion_type text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    severity text DEFAULT 'bilgi'::text NOT NULL,
    source_table text,
    source_record_id uuid,
    related_module text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_resolved boolean DEFAULT false NOT NULL,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_risk_suggestions_severity_check CHECK ((severity = ANY (ARRAY['kritik'::text, 'uyari'::text, 'bilgi'::text]))),
    CONSTRAINT ai_risk_suggestions_suggestion_type_check CHECK ((suggestion_type = ANY (ARRAY['risk_onleme'::text, 'psikososyal'::text, 'ergonomi'::text, 'egitim'::text, 'kaza_onleme'::text, 'veri_kalitesi'::text, 'genel'::text])))
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_name character varying(50) NOT NULL,
    record_id uuid,
    action character varying(20) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    session_id character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    user_id text,
    user_email text,
    entity_type text,
    entity_id text,
    detay jsonb,
    CONSTRAINT audit_log_action_check CHECK (((action)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying, 'ARCHIVE'::character varying])::text[])))
);


--
-- Name: ayarlar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ayarlar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(50) NOT NULL,
    value text,
    type character varying(50) DEFAULT 'general'::character varying,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: baglam_analizi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.baglam_analizi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tur text NOT NULL,
    baslik text NOT NULL,
    aciklama text,
    etki_analizi text,
    risk_firsat text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT baglam_analizi_risk_firsat_check CHECK ((risk_firsat = ANY (ARRAY['risk'::text, 'firsat'::text, 'her_ikisi'::text]))),
    CONSTRAINT baglam_analizi_tur_check CHECK ((tur = ANY (ARRAY['ic_baglam'::text, 'dis_baglam'::text, 'ilgili_taraf'::text])))
);










--
-- Name: birimler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.birimler (
    id integer NOT NULL,
    tip text NOT NULL,
    ad text NOT NULL,
    parent_id integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT birimler_tip_check CHECK ((tip = ANY (ARRAY['bina'::text, 'kat'::text, 'oda'::text, 'birim'::text])))
);


--
-- Name: birimler_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.birimler_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: birimler_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.birimler_id_seq OWNED BY public.birimler.id;


--
-- Name: data_quality_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_quality_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_name text NOT NULL,
    total_records integer DEFAULT 0 NOT NULL,
    complete_records integer DEFAULT 0 NOT NULL,
    missing_critical_fields integer DEFAULT 0 NOT NULL,
    outdated_records integer DEFAULT 0 NOT NULL,
    quality_score numeric(5,2) DEFAULT 0 NOT NULL,
    measured_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: data_transfer_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_transfer_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transfer_date timestamp with time zone DEFAULT now() NOT NULL,
    data_subject_id uuid,
    data_type text NOT NULL,
    recipient text NOT NULL,
    legal_basis text NOT NULL,
    transferred_by uuid,
    notified_at timestamp with time zone,
    notification_method text,
    is_breach boolean DEFAULT false NOT NULL,
    breach_assessment text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT data_transfer_log_data_type_check CHECK ((data_type = ANY (ARRAY['kimlik'::text, 'saglik'::text, 'iletisim'::text, 'finansal'::text, 'ogenel'::text]))),
    CONSTRAINT data_transfer_log_legal_basis_check CHECK ((legal_basis = ANY (ARRAY['izlenen_mukavelet'::text, 'zonunlu_razilik'::text, 'yasal_gorev'::text, 'yasal_hak_goceri'::text, 'yasal_teminat'::text, 'yasal_gizlilik'::text])))
);


--
-- Name: denetim_bulgulari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.denetim_bulgulari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    denetim_id uuid,
    bulgu_no text,
    bulgu_tipi text,
    bolum text,
    bulgu_aciklama text NOT NULL,
    dayanak_madde text,
    oneri text,
    sorumlu_kisi text,
    duzeltme_tarihi date,
    durum text DEFAULT 'acik'::text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT denetim_bulgulari_bulgu_tipi_check CHECK ((bulgu_tipi = ANY (ARRAY['uygunsuzluk'::text, 'gozlem'::text, 'firsat'::text, 'guclu_yon'::text]))),
    CONSTRAINT denetim_bulgulari_durum_check CHECK ((durum = ANY (ARRAY['acik'::text, 'devam'::text, 'tamamlandi'::text])))
);


--
-- Name: dokuman_kontrol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dokuman_kontrol (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dokuman_adi text NOT NULL,
    dokuman_no text,
    versiyon text DEFAULT '1.0'::text,
    dokuman_tipi text,
    icerik_ozeti text,
    hazirlayan text,
    onaylayan text,
    onay_tarihi date,
    yayin_tarihi date,
    gecerlilik_tarihi date,
    dosya_url text,
    durum text DEFAULT 'taslak'::text,
    degisiklik_aciklama text,
    ilgili_dokumanlar text[],
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT dokuman_kontrol_dokuman_tipi_check CHECK ((dokuman_tipi = ANY (ARRAY['prosedur'::text, 'talimat'::text, 'form'::text, 'plan'::text, 'rapor'::text, 'politika'::text, 'diger'::text]))),
    CONSTRAINT dokuman_kontrol_durum_check CHECK ((durum = ANY (ARRAY['taslak'::text, 'onay_bekliyor'::text, 'yayinda'::text, 'gecersiz'::text, 'arsiv'::text])))
);


--
-- Name: duzeltici_faaliyet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.duzeltici_faaliyet (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kaynak text,
    kaynak_id uuid,
    baslik text NOT NULL,
    uygunsuzluk_aciklama text NOT NULL,
    kok_neden_analizi text,
    analiz_yontemi text,
    duzeltici_aksiyon text NOT NULL,
    onleyici_aksiyon text,
    sorumlu_kisi text NOT NULL,
    baslangic_tarihi date DEFAULT now(),
    hedef_tarih date,
    tamamlanma_tarihi date,
    etki_degerlendirmesi text,
    dogrulama_sonucu text,
    durum text DEFAULT 'acik'::text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT duzeltici_faaliyet_analiz_yontemi_check CHECK ((analiz_yontemi = ANY (ARRAY['5_neden'::text, 'balik_kilcigi'::text, 'pareto'::text, 'fta'::text, 'diger'::text]))),
    CONSTRAINT duzeltici_faaliyet_dogrulama_sonucu_check CHECK ((dogrulama_sonucu = ANY (ARRAY['etkili'::text, 'kismen_etkili'::text, 'etkisiz'::text, 'beklemede'::text]))),
    CONSTRAINT duzeltici_faaliyet_durum_check CHECK ((durum = ANY (ARRAY['acik'::text, 'devam'::text, 'dogrulama'::text, 'tamamlandi'::text, 'kapatildi'::text]))),
    CONSTRAINT duzeltici_faaliyet_kaynak_check CHECK ((kaynak = ANY (ARRAY['is_kazasi'::text, 'denetim'::text, 'sikayet'::text, 'gozlem'::text, 'risk_analizi'::text, 'yasal_gereklilik'::text, 'diger'::text])))
);


--
-- Name: egitim_dosyalari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.egitim_dosyalari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    egitim_kaydi_id uuid NOT NULL,
    dosya_url text NOT NULL,
    dosya_adi text NOT NULL,
    dosya_uzantisi text,
    dosya_boyut bigint,
    eklenme_tarihi timestamp with time zone DEFAULT now(),
    silinme_tarihi timestamp with time zone
);


--
-- Name: egitim_katilimcilar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.egitim_katilimcilar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    egitim_kaydi_id uuid NOT NULL,
    personel_id uuid,
    katilimci_manuel text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: egitim_kayitlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.egitim_kayitlari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tanim_id uuid,
    egitim_adi_manuel text,
    egitmen_id uuid,
    egitmen_manuel text,
    tarih date,
    sure text,
    yer text,
    notlar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    yer_id uuid
);


--
-- Name: egitim_tanimlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.egitim_tanimlari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: egitim_yer_tanimlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.egitim_yer_tanimlari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: egitimler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.egitimler (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad character varying(100) NOT NULL,
    tarih date,
    sure character varying(20),
    egitmen character varying(100),
    yer character varying(100),
    katilimcilar text,
    notlar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: egitmen_tanimlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.egitmen_tanimlari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad text NOT NULL,
    iletisim text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ekipler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ekipler (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad character varying(100) NOT NULL,
    sorumlu_personel_id uuid,
    aktif boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ekipman_dosyalari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ekipman_dosyalari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ekipman_id uuid NOT NULL,
    dosya_url text NOT NULL,
    dosya_adi text NOT NULL,
    dosya_uzantisi text,
    dosya_boyut bigint,
    bitis_tarihi date,
    eklenme_tarihi timestamp with time zone DEFAULT now(),
    silinme_tarihi timestamp with time zone
);


--
-- Name: encryption_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encryption_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key_name text NOT NULL,
    key_type text DEFAULT 'aes-gcm'::text NOT NULL,
    key_value text NOT NULL,
    algorithm text DEFAULT 'AES-GCM'::text NOT NULL,
    key_size integer DEFAULT 256 NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    rotated_from uuid,
    rotation_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT encryption_keys_key_type_check CHECK ((key_type = ANY (ARRAY['aes-gcm'::text, 'aes-cbc'::text])))
);




--
-- Name: hibrit_calisma_ergonomi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hibrit_calisma_ergonomi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personel_id uuid,
    degerlendirme_tarihi date DEFAULT CURRENT_DATE NOT NULL,
    calisma_turu text NOT NULL,
    ofis_gunu_sayisi integer,
    masa_turu text,
    sandalye_turu text,
    ekran_yuksekligi_uygun boolean,
    klavye_fare_duzeni_uygun boolean,
    "ışık_yeterli" boolean,
    ses_seviyesi_uygun boolean,
    "sıcaklık_nem_uygun" boolean,
    molalar_egizi_uygun boolean,
    arbe_alkisi_uygun boolean,
    "yapısal_sorunlar" text,
    "önerilen_onlemler" text,
    durum text DEFAULT 'aktif'::text NOT NULL,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT hibrit_calisma_ergonomi_calisma_turu_check CHECK ((calisma_turu = ANY (ARRAY['tam_uzak'::text, 'hibrit'::text, 'ofiste'::text]))),
    CONSTRAINT hibrit_calisma_ergonomi_durum_check CHECK ((durum = ANY (ARRAY['aktif'::text, 'pasif'::text, 'tamamlandı'::text]))),
    CONSTRAINT hibrit_calisma_ergonomi_masa_turu_check CHECK ((masa_turu = ANY (ARRAY['normal'::text, 'ayarlanabilir_dikey'::text, 'ayarlanabilir_yatay'::text, 'ayarlanabilir_iki_yon'::text, 'diger'::text]))),
    CONSTRAINT hibrit_calisma_ergonomi_ofis_gunu_sayisi_check CHECK (((ofis_gunu_sayisi >= 0) AND (ofis_gunu_sayisi <= 5))),
    CONSTRAINT hibrit_calisma_ergonomi_sandalye_turu_check CHECK ((sandalye_turu = ANY (ARRAY['normal'::text, 'ergonomik'::text, 'ayarlanabilir_lordoz'::text, 'ayarlanabilir_kolluk'::text, 'diger'::text])))
);


--
-- Name: ic_denetim; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ic_denetim (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    denetim_adi text NOT NULL,
    denetim_tarihi date NOT NULL,
    denetim_tipi text DEFAULT 'ic'::text,
    denetci text NOT NULL,
    kapsam text,
    kapsam_alanlari text[],
    bulgu_sayisi integer DEFAULT 0,
    uygunsuzluk_sayisi integer DEFAULT 0,
    gozlem_sayisi integer DEFAULT 0,
    guclu_yonler text,
    iyilestirme_alanlari text,
    genel_degerlendirme text,
    rapor_url text,
    durum text DEFAULT 'planlandi'::text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT ic_denetim_denetim_tipi_check CHECK ((denetim_tipi = ANY (ARRAY['ic'::text, 'dis'::text, 'sertifikasyon'::text]))),
    CONSTRAINT ic_denetim_durum_check CHECK ((durum = ANY (ARRAY['planlandi'::text, 'devam'::text, 'tamamlandi'::text, 'iptal'::text])))
);


--
-- Name: ihtar_dosyalari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ihtar_dosyalari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ihtar_id uuid,
    dosya_url text NOT NULL,
    dosya_adi text NOT NULL,
    dosya_turu text,
    dosya_uzantisi text,
    dosya_boyut integer,
    neden text,
    eklenme_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    silinme_tarihi timestamp with time zone,
    CONSTRAINT ihtar_dosyalari_dosya_turu_check CHECK ((dosya_turu = ANY (ARRAY['gorsel'::text, 'belge'::text])))
);


--
-- Name: ihtar_tutanagi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ihtar_tutanagi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personel_id uuid,
    ihtar_tipi text DEFAULT 'uyari'::text,
    tarih date NOT NULL,
    yer text,
    konu text NOT NULL,
    aciklama text,
    dayanak_madde text,
    teblig_tarihi date,
    personel_gorusu text,
    durum text DEFAULT 'duzenlendi'::text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    ekip_adi character varying(200),
    CONSTRAINT ihtar_tutanagi_durum_check CHECK ((durum = ANY (ARRAY['duzenlendi'::text, 'teblig edildi'::text, 'itiraz var'::text, 'kapatildi'::text]))),
    CONSTRAINT ihtar_tutanagi_ihtar_tipi_check CHECK ((ihtar_tipi = ANY (ARRAY['yazili'::text, 'kesin'::text, 'uyari'::text, 'kinai'::text])))
);


--
-- Name: iletisim_kaydi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iletisim_kaydi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tur text NOT NULL,
    konu text NOT NULL,
    mesaj_icerik text,
    gonderen text,
    alici text,
    tarih date,
    yontem text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT iletisim_kaydi_tur_check CHECK ((tur = ANY (ARRAY['ic_iletisim'::text, 'dis_iletisim'::text, 'danisma'::text]))),
    CONSTRAINT iletisim_kaydi_yontem_check CHECK ((yontem = ANY (ARRAY['e_posta'::text, 'toplanti'::text, 'duyuru'::text, 'telefon'::text, 'yazi'::text, 'diger'::text])))
);


--
-- Name: is_ekipmanlari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.is_ekipmanlari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad character varying(100) NOT NULL,
    seri_no character varying(50),
    tip character varying(50),
    santiye_id uuid,
    son_kontrol_tarihi date,
    sonraki_kontrol_tarihi date,
    durum character varying(20) DEFAULT 'aktif'::character varying,
    notlar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    firma_adi text
);


--
-- Name: is_kazalari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.is_kazalari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personel_id uuid,
    tarih date NOT NULL,
    saat time without time zone,
    yer character varying(100),
    aciklama text,
    yaralanma_durumu character varying(50),
    hastane character varying(100),
    rapor_no character varying(50),
    onleyici_onlemler text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    bildirim_no character varying(50),
    bildirim_tarihi date,
    dosya_no character varying(50),
    yaralanan_uzuv text,
    uzuv_kaybi boolean DEFAULT false,
    uzuv_kaybi_aciklama text,
    calismaya_devam boolean DEFAULT false,
    tibbi_mudahale boolean DEFAULT false,
    istirahat_gun integer,
    istirahat_bitis_tarihi date,
    santiye_adi character varying(200),
    ise_donus_tarihi date,
    ise_donus_egitimi boolean DEFAULT false,
    kaza_tutanagi boolean DEFAULT false,
    kaza_tutanagi_dosyasi text,
    kaza_bildirim_dosyasi text,
    ise_donus_egitimi_dosyasi text,
    rapor_dosyasi text
);


--
-- Name: isci_katilimi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.isci_katilimi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tur text NOT NULL,
    baslik text NOT NULL,
    aciklama text,
    tarih date,
    katilimcilar text,
    sonuclar text,
    durum text DEFAULT 'planlandi'::text NOT NULL,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT isci_katilimi_durum_check CHECK ((durum = ANY (ARRAY['planlandi'::text, 'gerceklesti'::text, 'iptal'::text]))),
    CONSTRAINT isci_katilimi_tur_check CHECK ((tur = ANY (ARRAY['komite_toplandi'::text, 'calisan_danismasi'::text, 'anket'::text, 'oneri'::text])))
);




--
-- Name: kvkk_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kvkk_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personel_id uuid,
    consent_type character varying(50) NOT NULL,
    consent_given boolean DEFAULT false NOT NULL,
    consent_date timestamp with time zone DEFAULT now(),
    consent_version character varying(20) DEFAULT '1.0'::character varying,
    ip_address inet,
    user_agent text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kvkk_consents_consent_type_check CHECK (((consent_type)::text = ANY ((ARRAY['islenmesi'::character varying, 'saklanmasi'::character varying, 'paylasilmasi'::character varying, 'saglik_verisi'::character varying])::text[])))
);


--
-- Name: myk_belgeri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.myk_belgeri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personel_id uuid,
    belge_adi character varying(100) NOT NULL,
    belge_no character varying(50),
    alis_tarihi date,
    gecerlilik_tarihi date,
    durum character varying(20) DEFAULT 'gecerli'::character varying,
    notlar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: myk_egitim_listesi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.myk_egitim_listesi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad character varying(200) NOT NULL,
    aktif boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notlar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notlar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personel_id uuid,
    not_metni text,
    sira_no integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ohs_hedefleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ohs_hedefleri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hedef_adi text NOT NULL,
    aciklama text,
    kpi text,
    hedef_deger numeric,
    mevcut_deger numeric,
    birim text,
    baslangic_tarihi date,
    hedef_tarih date,
    sorumlu text,
    durum text DEFAULT 'devam'::text NOT NULL,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT ohs_hedefleri_durum_check CHECK ((durum = ANY (ARRAY['devam'::text, 'tamamlandi'::text, 'iptal'::text])))
);


--
-- Name: operator_belgeri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operator_belgeri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personel_id uuid,
    belge_adi character varying(100) NOT NULL,
    belge_no character varying(50),
    alis_tarihi date,
    gecerlilik_tarihi date,
    durum character varying(20) DEFAULT 'gecerli'::character varying,
    notlar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: performans_izleme; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performans_izleme (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    gosterge_adi text NOT NULL,
    gosterge_tipi text,
    birim text,
    hedef_deger numeric,
    gercek_deger numeric,
    olcum_tarihi date NOT NULL,
    onceki_deger numeric,
    trend text GENERATED ALWAYS AS (
CASE
    WHEN ((gercek_deger IS NULL) OR (onceki_deger IS NULL)) THEN 'bilinmiyor'::text
    WHEN (gercek_deger > onceki_deger) THEN 'artis'::text
    WHEN (gercek_deger < onceki_deger) THEN 'azalis'::text
    ELSE 'sabit'::text
END) STORED,
    hedef_ulasildi_mu boolean GENERATED ALWAYS AS (
CASE
    WHEN ((gercek_deger IS NULL) OR (hedef_deger IS NULL)) THEN NULL::boolean
    WHEN (gercek_deger >= hedef_deger) THEN true
    ELSE false
END) STORED,
    aciklama text,
    aksiyon_gerekli_mu boolean DEFAULT false,
    aksiyon_aciklama text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT performans_izleme_gosterge_tipi_check CHECK ((gosterge_tipi = ANY (ARRAY['leading'::text, 'lagging'::text])))
);


--
-- Name: personel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personel (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kimlik_no character varying(11) NOT NULL,
    ise_giris_tarihi date,
    meslek_kodu character varying(50),
    telefon character varying(20),
    santiye_adi character varying(100),
    ekip_adi character varying(100),
    yuksekte_calisma_tarihi date,
    myk_tarihi date,
    operator_belgesi_tarihi date,
    kkd_tarihi date,
    oryantasyon_tarihi date,
    kan_grubu character varying(5),
    yuksekte_calisir boolean DEFAULT false,
    yuksekte_calisamaz boolean DEFAULT false,
    gece_calisir boolean DEFAULT false,
    gece_calisamaz boolean DEFAULT false,
    vardiyali_calisir boolean DEFAULT false,
    vardiyali_calisamaz boolean DEFAULT false,
    notlar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email character varying(100),
    saglik_raporu_tarihi date,
    isg_egitim_tarihi date,
    ogrenim_durumu text,
    kronik_rahatlik text,
    ad character varying(50),
    soyad character varying(50),
    sgk_tarihi date,
    sertifika character varying(100),
    sertifika_tarihi date,
    isg_egitim_gecerlilik_suresi integer,
    yuksekte_calisma_gecerlilik_suresi integer,
    myk_gecerlilik_suresi integer,
    sertifika_gecerlilik_suresi integer,
    operator_belgesi_gecerlilik_suresi integer,
    kkd_gecerlilik_suresi integer,
    oryantasyon_gecerlilik_suresi integer,
    saglik_raporu_gecerlilik_suresi integer,
    arsivde boolean DEFAULT false,
    ayrilis_tarihi date,
    ayrilis_nedeni text,
    ekip_id uuid,
    taseron_id uuid,
    adres text,
    acil_durum_irtibat character varying(255),
    acil_durum_telefon character varying(20),
    sgk_no character varying(11),
    gorevlendirme_tarihi date,
    gorevlendirme_gecerlilik_suresi integer,
    gorevlendirme_gecerlilik_tarihi date,
    adli_sicil_tarihi date,
    hat character varying(30),
    is_akdi_durumu character varying(20) DEFAULT 'normal'::character varying,
    CONSTRAINT personel_ayrilis_nedeni_check CHECK ((ayrilis_nedeni = ANY (ARRAY['istirak_ayrilis'::text, 'hatali_kayit'::text]))),
    CONSTRAINT personel_is_akdi_durumu_check CHECK (((is_akdi_durumu)::text = ANY ((ARRAY['normal'::character varying, 'sonlandirma_surecinde'::character varying, 'sonlandi'::character varying])::text[]))),
    CONSTRAINT personel_isg_egitim_gecerlilik_suresi_check CHECK (((isg_egitim_gecerlilik_suresi >= 1) AND (isg_egitim_gecerlilik_suresi <= 5))),
    CONSTRAINT personel_kkd_gecerlilik_suresi_check CHECK (((kkd_gecerlilik_suresi >= 1) AND (kkd_gecerlilik_suresi <= 5))),
    CONSTRAINT personel_myk_gecerlilik_suresi_check CHECK (((myk_gecerlilik_suresi >= 1) AND (myk_gecerlilik_suresi <= 5))),
    CONSTRAINT personel_operator_belgesi_gecerlilik_suresi_check CHECK (((operator_belgesi_gecerlilik_suresi >= 1) AND (operator_belgesi_gecerlilik_suresi <= 5))),
    CONSTRAINT personel_oryantasyon_gecerlilik_suresi_check CHECK (((oryantasyon_gecerlilik_suresi >= 1) AND (oryantasyon_gecerlilik_suresi <= 5))),
    CONSTRAINT personel_saglik_raporu_gecerlilik_suresi_check CHECK (((saglik_raporu_gecerlilik_suresi >= 1) AND (saglik_raporu_gecerlilik_suresi <= 5))),
    CONSTRAINT personel_sertifika_gecerlilik_suresi_check CHECK (((sertifika_gecerlilik_suresi >= 1) AND (sertifika_gecerlilik_suresi <= 5))),
    CONSTRAINT personel_yuksekte_calisma_gecerlilik_suresi_check CHECK (((yuksekte_calisma_gecerlilik_suresi >= 1) AND (yuksekte_calisma_gecerlilik_suresi <= 5)))
);


--
-- Name: personel_belgeleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personel_belgeleri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personel_id uuid,
    belge_tipi text NOT NULL,
    dosya_url text NOT NULL,
    dosya_adi text NOT NULL,
    dosya_uzantisi text,
    dosya_boyut integer,
    aciklama text,
    eklenme_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    silinme_tarihi timestamp with time zone,
    onay_durumu text DEFAULT 'beklemede'::text NOT NULL,
    son_gecerlilik_tarihi date,
    red_aciklama text,
    onaylayan_id uuid,
    onay_tarihi timestamp with time zone,
    CONSTRAINT personel_belgeleri_belge_tipi_check CHECK ((belge_tipi = ANY (ARRAY['isg_egitim'::text, 'yuksekte_calisma'::text, 'myk'::text, 'operator_belgesi'::text, 'kkd'::text, 'oryantasyon'::text, 'saglik_raporu'::text, 'diger'::text])))
);


--
-- Name: personel_dosyasi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personel_dosyasi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personel_id uuid,
    belge_adi character varying(100) NOT NULL,
    belge_turu character varying(50),
    tarih date,
    dosya_url text,
    notlar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: personel_myk_egitimleri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personel_myk_egitimleri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personel_id uuid,
    myk_egitim_id uuid,
    alis_tarihi date,
    gecerlilik_suresi integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT personel_myk_egitimleri_gecerlilik_suresi_check CHECK (((gecerlilik_suresi >= 1) AND (gecerlilik_suresi <= 5)))
);


--
-- Name: personel_santiyeler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personel_santiyeler (
    personel_id uuid NOT NULL,
    santiye_id uuid NOT NULL
);


--
-- Name: personel_talimat_matrisi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personel_talimat_matrisi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personel_id uuid,
    talimat_adi character varying(200) NOT NULL,
    tarih date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    dosya_url text,
    dosya_adi text,
    dosya_uzantisi text,
    dosya_boyut bigint
);




--
-- Name: politika_yonetimi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.politika_yonetimi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    baslik text NOT NULL,
    politika_metni text,
    versiyon text DEFAULT '1.0'::text,
    onay_tarihi date,
    gecerlilik_tarihi date,
    durum text DEFAULT 'aktif'::text NOT NULL,
    onaylayan text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT politika_yonetimi_durum_check CHECK ((durum = ANY (ARRAY['aktif'::text, 'gecersiz'::text])))
);


--
-- Name: psikososyal_risk_degerlendirme; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.psikososyal_risk_degerlendirme (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    santiye_id uuid,
    bolum text,
    risk_faktoru text NOT NULL,
    aciklama text,
    olasilik integer NOT NULL,
    etki integer NOT NULL,
    risk_skoru integer GENERATED ALWAYS AS ((olasilik * etki)) STORED,
    risk_seviyesi text GENERATED ALWAYS AS (
CASE
    WHEN ((olasilik * etki) <= 4) THEN 'Düşük'::text
    WHEN ((olasilik * etki) <= 9) THEN 'Orta'::text
    WHEN ((olasilik * etki) <= 15) THEN 'Yüksek'::text
    ELSE 'Kritik'::text
END) STORED,
    onlenen_onlemler text,
    tavsiye_edilen_onlemler text,
    sorumlu_kisi text,
    durum text DEFAULT 'aktif'::text NOT NULL,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT psikososyal_risk_degerlendirme_durum_check CHECK ((durum = ANY (ARRAY['aktif'::text, 'pasif'::text, 'giderildi'::text]))),
    CONSTRAINT psikososyal_risk_degerlendirme_etki_check CHECK (((etki >= 1) AND (etki <= 5))),
    CONSTRAINT psikososyal_risk_degerlendirme_olasilik_check CHECK (((olasilik >= 1) AND (olasilik <= 5)))
);


--
-- Name: risk_degerlendirme; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.risk_degerlendirme (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    santiye_id uuid,
    risk_adi text NOT NULL,
    bolum text,
    tehlike_tipi text,
    mevcut_onlem text,
    olasilik integer DEFAULT 1,
    siddet integer DEFAULT 1,
    risk_skoru integer GENERATED ALWAYS AS ((olasilik * siddet)) STORED,
    risk_seviyesi text GENERATED ALWAYS AS (
CASE
    WHEN ((olasilik * siddet) <= 4) THEN 'Dusuk'::text
    WHEN ((olasilik * siddet) <= 9) THEN 'Orta'::text
    WHEN ((olasilik * siddet) <= 15) THEN 'Yuksek'::text
    ELSE 'Kritik'::text
END) STORED,
    ek_onlemler text,
    sorumlu_kisi text,
    tamamlanma_tarihi date,
    durum text DEFAULT 'acik'::text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT risk_degerlendirme_durum_check CHECK ((durum = ANY (ARRAY['acik'::text, 'devam'::text, 'tamamlandi'::text, 'iptal'::text]))),
    CONSTRAINT risk_degerlendirme_olasilik_check CHECK (((olasilik >= 1) AND (olasilik <= 5))),
    CONSTRAINT risk_degerlendirme_siddet_check CHECK (((siddet >= 1) AND (siddet <= 5)))
);


--
-- Name: saha_sorumlulari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saha_sorumlulari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad_soyad character varying(100) NOT NULL,
    telefon character varying(20),
    email character varying(100),
    pozisyon character varying(50),
    santiye_id uuid,
    durum character varying(20) DEFAULT 'aktif'::character varying,
    notlar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: santiyeler; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.santiyeler (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad character varying(100) NOT NULL,
    adres text,
    sorumlu character varying(100),
    telefon character varying(20),
    baslangic_tarihi date,
    bitis_tarihi date,
    durum character varying(20) DEFAULT 'aktif'::character varying,
    notlar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    sicil_numarasi character varying(100),
    yapilacak_isler text,
    calisan_temsilcisi character varying(200),
    destek_elemani character varying(200),
    acil_durum_ekipleri text,
    is_sozlesme_dosyasi text,
    risk_analizi_dosyasi text,
    acil_durum_plani_dosyasi text,
    tatbikat_dosyasi text,
    calisan_temsilcisi_dosyasi text,
    destek_elemani_dosyasi text,
    yapilacak_isler_dosyasi text,
    acil_durum_ekipleri_dosyasi text,
    yapi_ruhsati_dosyasi text
);




--
-- Name: talimatlar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.talimatlar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    baslik character varying(100) NOT NULL,
    icerik text,
    tarih date,
    hedef character varying(50),
    durum character varying(20) DEFAULT 'aktif'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: taseron_sorumlulari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taseron_sorumlulari (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    taseron_id uuid,
    ad_soyad character varying(150) NOT NULL,
    telefon character varying(20),
    email character varying(100),
    pozisyon character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: taseronlar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.taseronlar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    firma_adi character varying(100) NOT NULL,
    yetkili character varying(100),
    telefon character varying(20),
    email character varying(100),
    adres text,
    vergi_no character varying(20),
    santiye_id uuid,
    durum character varying(20) DEFAULT 'aktif'::character varying,
    notlar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    personel_zorunlu_alanlar jsonb DEFAULT '[]'::jsonb
);








--
-- Name: versiyonlar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.versiyonlar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    versiyon text NOT NULL,
    tarih date DEFAULT now() NOT NULL,
    tip text,
    aciklama text NOT NULL,
    detaylar text[],
    yazar text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT versiyonlar_tip_check CHECK ((tip = ANY (ARRAY['major'::text, 'minor'::text, 'patch'::text, 'hotfix'::text])))
);


--
-- Name: yasal_uygunluk; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yasal_uygunluk (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    yasal_metin_adi text NOT NULL,
    yasal_dayanak text,
    yayin_tarihi date,
    resmi_gazete_no text,
    kapsam text,
    uyumluluk_durumu text DEFAULT 'degerlendirilecek'::text,
    uyumsuzluk_aciklama text,
    gerekli_aksiyonlar text,
    sorumlu_kisi text,
    son_degerlendirme_tarihi date,
    sonraki_degerlendirme_tarihi date,
    notlar text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT yasal_uygunluk_uyumluluk_durumu_check CHECK ((uyumluluk_durumu = ANY (ARRAY['uyumlu'::text, 'kismen_uyumlu'::text, 'uyumsuz'::text, 'degerlendirilecek'::text])))
);


--
-- Name: yedekleme_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yedekleme_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mod character varying(20) NOT NULL,
    tablo_sayisi integer DEFAULT 0 NOT NULL,
    kayit_sayisi integer DEFAULT 0 NOT NULL,
    dosya_sayisi integer DEFAULT 0 NOT NULL,
    dosya_boyutu_bytes bigint DEFAULT 0 NOT NULL,
    hata text,
    olusturulma timestamp with time zone DEFAULT now(),
    CONSTRAINT yedekleme_log_mod_check CHECK (((mod)::text = ANY ((ARRAY['tam'::character varying, 'kismi'::character varying])::text[])))
);


--
-- Name: yetkinlik_matrisi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yetkinlik_matrisi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    personel_id uuid,
    yetkinlik_adi text NOT NULL,
    yetkinlik_tipi text,
    zorunlu_mu boolean DEFAULT false,
    seviye integer DEFAULT 1,
    gereken_seviye integer DEFAULT 1,
    alis_tarihi date,
    gecerlilik_tarihi date,
    veren_kurum text,
    belge_no text,
    belge_url text,
    durum text DEFAULT 'gecerli'::text,
    notlar text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT yetkinlik_matrisi_durum_check CHECK ((durum = ANY (ARRAY['gecerli'::text, 'suresi_doluyor'::text, 'suresi_dolmus'::text, 'beklemede'::text]))),
    CONSTRAINT yetkinlik_matrisi_gereken_seviye_check CHECK (((gereken_seviye >= 1) AND (gereken_seviye <= 5))),
    CONSTRAINT yetkinlik_matrisi_seviye_check CHECK (((seviye >= 1) AND (seviye <= 5))),
    CONSTRAINT yetkinlik_matrisi_yetkinlik_tipi_check CHECK ((yetkinlik_tipi = ANY (ARRAY['egitim'::text, 'sertifika'::text, 'deneyim'::text, 'lisans'::text, 'diger'::text])))
);


--
-- Name: yonetim_gozden_gecirme; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yonetim_gozden_gecirme (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "toplantı_adi" text NOT NULL,
    "toplantı_tarihi" date NOT NULL,
    katilimcilar text[],
    gundem_maddeleri text[],
    isg_performans_ozeti text,
    kaza_istatistikleri text,
    denetim_sonuclari text,
    yasal_uygunluk_durumu text,
    risk_degerlendirme_guncelleme text,
    kaynak_yeterliligi text,
    iyilestirme_firsatlari text,
    aksiyon_kararlari text,
    bir_onceki_toplanti_takibi text,
    sonuclar_ve_oneriler text,
    rapor_url text,
    durum text DEFAULT 'planlandi'::text,
    olusturma_tarihi timestamp with time zone DEFAULT now(),
    guncelleme_tarihi timestamp with time zone DEFAULT now(),
    CONSTRAINT yonetim_gozden_gecirme_durum_check CHECK ((durum = ANY (ARRAY['planlandi'::text, 'yapildi'::text, 'rapor_hazirlaniyor'::text, 'tamamlandi'::text])))
);


--
-- Name: birimler id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.birimler ALTER COLUMN id SET DEFAULT nextval('public.birimler_id_seq'::regclass);


--
-- Name: acil_durum acil_durum_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.acil_durum
    ADD CONSTRAINT acil_durum_pkey PRIMARY KEY (id);


--
-- Name: ai_risk_suggestions ai_risk_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_risk_suggestions
    ADD CONSTRAINT ai_risk_suggestions_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: ayarlar ayarlar_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ayarlar
    ADD CONSTRAINT ayarlar_key_key UNIQUE (key);


--
-- Name: ayarlar ayarlar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ayarlar
    ADD CONSTRAINT ayarlar_pkey PRIMARY KEY (id);


--
-- Name: baglam_analizi baglam_analizi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.baglam_analizi
    ADD CONSTRAINT baglam_analizi_pkey PRIMARY KEY (id);


--
-- Name: birimler birimler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.birimler
    ADD CONSTRAINT birimler_pkey PRIMARY KEY (id);


--
-- Name: data_quality_metrics data_quality_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_quality_metrics
    ADD CONSTRAINT data_quality_metrics_pkey PRIMARY KEY (id);


--
-- Name: data_transfer_log data_transfer_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_transfer_log
    ADD CONSTRAINT data_transfer_log_pkey PRIMARY KEY (id);


--
-- Name: denetim_bulgulari denetim_bulgulari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denetim_bulgulari
    ADD CONSTRAINT denetim_bulgulari_pkey PRIMARY KEY (id);


--
-- Name: dokuman_kontrol dokuman_kontrol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dokuman_kontrol
    ADD CONSTRAINT dokuman_kontrol_pkey PRIMARY KEY (id);


--
-- Name: duzeltici_faaliyet duzeltici_faaliyet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.duzeltici_faaliyet
    ADD CONSTRAINT duzeltici_faaliyet_pkey PRIMARY KEY (id);


--
-- Name: egitim_dosyalari egitim_dosyalari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_dosyalari
    ADD CONSTRAINT egitim_dosyalari_pkey PRIMARY KEY (id);


--
-- Name: egitim_katilimcilar egitim_katilimcilar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_katilimcilar
    ADD CONSTRAINT egitim_katilimcilar_pkey PRIMARY KEY (id);


--
-- Name: egitim_kayitlari egitim_kayitlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_kayitlari
    ADD CONSTRAINT egitim_kayitlari_pkey PRIMARY KEY (id);


--
-- Name: egitim_tanimlari egitim_tanimlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_tanimlari
    ADD CONSTRAINT egitim_tanimlari_pkey PRIMARY KEY (id);


--
-- Name: egitim_yer_tanimlari egitim_yer_tanimlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_yer_tanimlari
    ADD CONSTRAINT egitim_yer_tanimlari_pkey PRIMARY KEY (id);


--
-- Name: egitimler egitimler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitimler
    ADD CONSTRAINT egitimler_pkey PRIMARY KEY (id);


--
-- Name: egitmen_tanimlari egitmen_tanimlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitmen_tanimlari
    ADD CONSTRAINT egitmen_tanimlari_pkey PRIMARY KEY (id);


--
-- Name: ekipler ekipler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ekipler
    ADD CONSTRAINT ekipler_pkey PRIMARY KEY (id);


--
-- Name: ekipman_dosyalari ekipman_dosyalari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ekipman_dosyalari
    ADD CONSTRAINT ekipman_dosyalari_pkey PRIMARY KEY (id);


--
-- Name: encryption_keys encryption_keys_key_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encryption_keys
    ADD CONSTRAINT encryption_keys_key_name_key UNIQUE (key_name);


--
-- Name: encryption_keys encryption_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encryption_keys
    ADD CONSTRAINT encryption_keys_pkey PRIMARY KEY (id);


--
-- Name: hibrit_calisma_ergonomi hibrit_calisma_ergonomi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hibrit_calisma_ergonomi
    ADD CONSTRAINT hibrit_calisma_ergonomi_pkey PRIMARY KEY (id);


--
-- Name: ic_denetim ic_denetim_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ic_denetim
    ADD CONSTRAINT ic_denetim_pkey PRIMARY KEY (id);


--
-- Name: ihtar_dosyalari ihtar_dosyalari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ihtar_dosyalari
    ADD CONSTRAINT ihtar_dosyalari_pkey PRIMARY KEY (id);


--
-- Name: ihtar_tutanagi ihtar_tutanagi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ihtar_tutanagi
    ADD CONSTRAINT ihtar_tutanagi_pkey PRIMARY KEY (id);


--
-- Name: iletisim_kaydi iletisim_kaydi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iletisim_kaydi
    ADD CONSTRAINT iletisim_kaydi_pkey PRIMARY KEY (id);


--
-- Name: is_ekipmanlari is_ekipmanlari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.is_ekipmanlari
    ADD CONSTRAINT is_ekipmanlari_pkey PRIMARY KEY (id);


--
-- Name: is_kazalari is_kazalari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.is_kazalari
    ADD CONSTRAINT is_kazalari_pkey PRIMARY KEY (id);


--
-- Name: isci_katilimi isci_katilimi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.isci_katilimi
    ADD CONSTRAINT isci_katilimi_pkey PRIMARY KEY (id);


--
-- Name: kvkk_consents kvkk_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kvkk_consents
    ADD CONSTRAINT kvkk_consents_pkey PRIMARY KEY (id);


--
-- Name: myk_belgeri myk_belgeri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.myk_belgeri
    ADD CONSTRAINT myk_belgeri_pkey PRIMARY KEY (id);


--
-- Name: myk_egitim_listesi myk_egitim_listesi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.myk_egitim_listesi
    ADD CONSTRAINT myk_egitim_listesi_pkey PRIMARY KEY (id);


--
-- Name: notlar notlar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notlar
    ADD CONSTRAINT notlar_pkey PRIMARY KEY (id);


--
-- Name: ohs_hedefleri ohs_hedefleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ohs_hedefleri
    ADD CONSTRAINT ohs_hedefleri_pkey PRIMARY KEY (id);


--
-- Name: operator_belgeri operator_belgeri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operator_belgeri
    ADD CONSTRAINT operator_belgeri_pkey PRIMARY KEY (id);


--
-- Name: performans_izleme performans_izleme_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performans_izleme
    ADD CONSTRAINT performans_izleme_pkey PRIMARY KEY (id);


--
-- Name: personel_belgeleri personel_belgeleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_belgeleri
    ADD CONSTRAINT personel_belgeleri_pkey PRIMARY KEY (id);


--
-- Name: personel_dosyasi personel_dosyasi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_dosyasi
    ADD CONSTRAINT personel_dosyasi_pkey PRIMARY KEY (id);


--
-- Name: personel personel_kimlik_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel
    ADD CONSTRAINT personel_kimlik_no_key UNIQUE (kimlik_no);


--
-- Name: personel_myk_egitimleri personel_myk_egitimleri_personel_id_myk_egitim_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_myk_egitimleri
    ADD CONSTRAINT personel_myk_egitimleri_personel_id_myk_egitim_id_key UNIQUE (personel_id, myk_egitim_id);


--
-- Name: personel_myk_egitimleri personel_myk_egitimleri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_myk_egitimleri
    ADD CONSTRAINT personel_myk_egitimleri_pkey PRIMARY KEY (id);


--
-- Name: personel personel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel
    ADD CONSTRAINT personel_pkey PRIMARY KEY (id);


--
-- Name: personel_santiyeler personel_santiyeler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_santiyeler
    ADD CONSTRAINT personel_santiyeler_pkey PRIMARY KEY (personel_id, santiye_id);


--
-- Name: personel_talimat_matrisi personel_talimat_matrisi_personel_id_talimat_adi_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_talimat_matrisi
    ADD CONSTRAINT personel_talimat_matrisi_personel_id_talimat_adi_key UNIQUE (personel_id, talimat_adi);


--
-- Name: personel_talimat_matrisi personel_talimat_matrisi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_talimat_matrisi
    ADD CONSTRAINT personel_talimat_matrisi_pkey PRIMARY KEY (id);


--
-- Name: politika_yonetimi politika_yonetimi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.politika_yonetimi
    ADD CONSTRAINT politika_yonetimi_pkey PRIMARY KEY (id);


--
-- Name: psikososyal_risk_degerlendirme psikososyal_risk_degerlendirme_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.psikososyal_risk_degerlendirme
    ADD CONSTRAINT psikososyal_risk_degerlendirme_pkey PRIMARY KEY (id);


--
-- Name: risk_degerlendirme risk_degerlendirme_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_degerlendirme
    ADD CONSTRAINT risk_degerlendirme_pkey PRIMARY KEY (id);


--
-- Name: saha_sorumlulari saha_sorumlulari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saha_sorumlulari
    ADD CONSTRAINT saha_sorumlulari_pkey PRIMARY KEY (id);


--
-- Name: santiyeler santiyeler_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.santiyeler
    ADD CONSTRAINT santiyeler_pkey PRIMARY KEY (id);


--
-- Name: talimatlar talimatlar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.talimatlar
    ADD CONSTRAINT talimatlar_pkey PRIMARY KEY (id);


--
-- Name: taseron_sorumlulari taseron_sorumlulari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taseron_sorumlulari
    ADD CONSTRAINT taseron_sorumlulari_pkey PRIMARY KEY (id);


--
-- Name: taseronlar taseronlar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taseronlar
    ADD CONSTRAINT taseronlar_pkey PRIMARY KEY (id);


--
-- Name: versiyonlar versiyonlar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.versiyonlar
    ADD CONSTRAINT versiyonlar_pkey PRIMARY KEY (id);


--
-- Name: yasal_uygunluk yasal_uygunluk_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yasal_uygunluk
    ADD CONSTRAINT yasal_uygunluk_pkey PRIMARY KEY (id);


--
-- Name: yedekleme_log yedekleme_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yedekleme_log
    ADD CONSTRAINT yedekleme_log_pkey PRIMARY KEY (id);


--
-- Name: yetkinlik_matrisi yetkinlik_matrisi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yetkinlik_matrisi
    ADD CONSTRAINT yetkinlik_matrisi_pkey PRIMARY KEY (id);


--
-- Name: yonetim_gozden_gecirme yonetim_gozden_gecirme_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yonetim_gozden_gecirme
    ADD CONSTRAINT yonetim_gozden_gecirme_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_suggestions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_suggestions_created ON public.ai_risk_suggestions USING btree (created_at DESC);


--
-- Name: idx_ai_suggestions_resolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_suggestions_resolved ON public.ai_risk_suggestions USING btree (is_resolved);


--
-- Name: idx_ai_suggestions_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_suggestions_severity ON public.ai_risk_suggestions USING btree (severity);


--
-- Name: idx_ai_suggestions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_suggestions_type ON public.ai_risk_suggestions USING btree (suggestion_type);


--
-- Name: idx_audit_log_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_action ON public.audit_log USING btree (action);


--
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_created_at ON public.audit_log USING btree (created_at DESC);


--
-- Name: idx_audit_log_table_record; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_table_record ON public.audit_log USING btree (table_name, record_id);


--
-- Name: idx_data_quality_measured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_quality_measured ON public.data_quality_metrics USING btree (measured_at DESC);


--
-- Name: idx_data_quality_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_quality_module ON public.data_quality_metrics USING btree (module_name);


--
-- Name: idx_data_transfer_log_breach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_transfer_log_breach ON public.data_transfer_log USING btree (is_breach) WHERE (is_breach = true);


--
-- Name: idx_data_transfer_log_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_transfer_log_date ON public.data_transfer_log USING btree (transfer_date);


--
-- Name: idx_data_transfer_log_notified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_transfer_log_notified ON public.data_transfer_log USING btree (notified_at) WHERE (notified_at IS NULL);


--
-- Name: idx_data_transfer_log_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_data_transfer_log_subject ON public.data_transfer_log USING btree (data_subject_id);


--
-- Name: idx_egitim_dosyalari_kaydi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_egitim_dosyalari_kaydi ON public.egitim_dosyalari USING btree (egitim_kaydi_id);


--
-- Name: idx_egitim_katilimcilar_kaydi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_egitim_katilimcilar_kaydi ON public.egitim_katilimcilar USING btree (egitim_kaydi_id);


--
-- Name: idx_egitim_katilimcilar_personel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_egitim_katilimcilar_personel ON public.egitim_katilimcilar USING btree (personel_id);


--
-- Name: idx_ekipman_dosyalari_ekipman_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ekipman_dosyalari_ekipman_id ON public.ekipman_dosyalari USING btree (ekipman_id);


--
-- Name: idx_encryption_keys_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_encryption_keys_active ON public.encryption_keys USING btree (is_active);


--
-- Name: idx_encryption_keys_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_encryption_keys_name ON public.encryption_keys USING btree (key_name);


--
-- Name: idx_hibrit_calisma_ergonomi_durum; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hibrit_calisma_ergonomi_durum ON public.hibrit_calisma_ergonomi USING btree (durum);


--
-- Name: idx_hibrit_calisma_ergonomi_personel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hibrit_calisma_ergonomi_personel ON public.hibrit_calisma_ergonomi USING btree (personel_id);


--
-- Name: idx_hibrit_calisma_ergonomi_tarih; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hibrit_calisma_ergonomi_tarih ON public.hibrit_calisma_ergonomi USING btree (degerlendirme_tarihi);


--
-- Name: idx_kvkk_consents_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_kvkk_consents_unique ON public.kvkk_consents USING btree (personel_id, consent_type);


--
-- Name: idx_psikososyal_risk_bolum; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_psikososyal_risk_bolum ON public.psikososyal_risk_degerlendirme USING btree (bolum);


--
-- Name: idx_psikososyal_risk_santiye; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_psikososyal_risk_santiye ON public.psikososyal_risk_degerlendirme USING btree (santiye_id);


--
-- Name: idx_psikososyal_risk_seviye; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_psikososyal_risk_seviye ON public.psikososyal_risk_degerlendirme USING btree (risk_seviyesi);


--
-- Name: idx_psikososyal_risk_skor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_psikososyal_risk_skor ON public.psikososyal_risk_degerlendirme USING btree (risk_skoru);


--
-- Name: idx_yedekleme_log_tarih; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yedekleme_log_tarih ON public.yedekleme_log USING btree (olusturulma DESC);


--
-- Name: encryption_keys trg_encryption_keys_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_encryption_keys_audit AFTER INSERT OR DELETE OR UPDATE ON public.encryption_keys FOR EACH ROW EXECUTE FUNCTION public.log_encryption_key_audit();


--
-- Name: birimler birimler_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.birimler
    ADD CONSTRAINT birimler_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.birimler(id) ON DELETE CASCADE;


--
-- Name: data_transfer_log data_transfer_log_data_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_transfer_log
    ADD CONSTRAINT data_transfer_log_data_subject_id_fkey FOREIGN KEY (data_subject_id) REFERENCES public.personel(id) ON DELETE SET NULL;


--
-- Name: data_transfer_log data_transfer_log_transferred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_transfer_log
    ADD CONSTRAINT data_transfer_log_transferred_by_fkey FOREIGN KEY (transferred_by) REFERENCES public.personel(id) ON DELETE SET NULL;


--
-- Name: denetim_bulgulari denetim_bulgulari_denetim_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.denetim_bulgulari
    ADD CONSTRAINT denetim_bulgulari_denetim_id_fkey FOREIGN KEY (denetim_id) REFERENCES public.ic_denetim(id) ON DELETE CASCADE;


--
-- Name: egitim_dosyalari egitim_dosyalari_egitim_kaydi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_dosyalari
    ADD CONSTRAINT egitim_dosyalari_egitim_kaydi_id_fkey FOREIGN KEY (egitim_kaydi_id) REFERENCES public.egitim_kayitlari(id) ON DELETE CASCADE;


--
-- Name: egitim_katilimcilar egitim_katilimcilar_egitim_kaydi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_katilimcilar
    ADD CONSTRAINT egitim_katilimcilar_egitim_kaydi_id_fkey FOREIGN KEY (egitim_kaydi_id) REFERENCES public.egitim_kayitlari(id) ON DELETE CASCADE;


--
-- Name: egitim_katilimcilar egitim_katilimcilar_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_katilimcilar
    ADD CONSTRAINT egitim_katilimcilar_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE SET NULL;


--
-- Name: egitim_kayitlari egitim_kayitlari_egitmen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_kayitlari
    ADD CONSTRAINT egitim_kayitlari_egitmen_id_fkey FOREIGN KEY (egitmen_id) REFERENCES public.egitmen_tanimlari(id) ON DELETE SET NULL;


--
-- Name: egitim_kayitlari egitim_kayitlari_tanim_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_kayitlari
    ADD CONSTRAINT egitim_kayitlari_tanim_id_fkey FOREIGN KEY (tanim_id) REFERENCES public.egitim_tanimlari(id) ON DELETE SET NULL;


--
-- Name: egitim_kayitlari egitim_kayitlari_yer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egitim_kayitlari
    ADD CONSTRAINT egitim_kayitlari_yer_id_fkey FOREIGN KEY (yer_id) REFERENCES public.egitim_yer_tanimlari(id) ON DELETE SET NULL;


--
-- Name: ekipler ekipler_sorumlu_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ekipler
    ADD CONSTRAINT ekipler_sorumlu_personel_id_fkey FOREIGN KEY (sorumlu_personel_id) REFERENCES public.personel(id) ON DELETE SET NULL;


--
-- Name: ekipman_dosyalari ekipman_dosyalari_ekipman_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ekipman_dosyalari
    ADD CONSTRAINT ekipman_dosyalari_ekipman_id_fkey FOREIGN KEY (ekipman_id) REFERENCES public.is_ekipmanlari(id) ON DELETE CASCADE;


--
-- Name: encryption_keys encryption_keys_rotated_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encryption_keys
    ADD CONSTRAINT encryption_keys_rotated_from_fkey FOREIGN KEY (rotated_from) REFERENCES public.encryption_keys(id) ON DELETE SET NULL;


--
-- Name: hibrit_calisma_ergonomi hibrit_calisma_ergonomi_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hibrit_calisma_ergonomi
    ADD CONSTRAINT hibrit_calisma_ergonomi_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE SET NULL;


--
-- Name: ihtar_dosyalari ihtar_dosyalari_ihtar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ihtar_dosyalari
    ADD CONSTRAINT ihtar_dosyalari_ihtar_id_fkey FOREIGN KEY (ihtar_id) REFERENCES public.ihtar_tutanagi(id) ON DELETE CASCADE;


--
-- Name: ihtar_tutanagi ihtar_tutanagi_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ihtar_tutanagi
    ADD CONSTRAINT ihtar_tutanagi_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE SET NULL;


--
-- Name: is_ekipmanlari is_ekipmanlari_santiye_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.is_ekipmanlari
    ADD CONSTRAINT is_ekipmanlari_santiye_id_fkey FOREIGN KEY (santiye_id) REFERENCES public.santiyeler(id);


--
-- Name: is_kazalari is_kazalari_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.is_kazalari
    ADD CONSTRAINT is_kazalari_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id);


--
-- Name: kvkk_consents kvkk_consents_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kvkk_consents
    ADD CONSTRAINT kvkk_consents_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE CASCADE;


--
-- Name: myk_belgeri myk_belgeri_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.myk_belgeri
    ADD CONSTRAINT myk_belgeri_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE CASCADE;


--
-- Name: notlar notlar_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notlar
    ADD CONSTRAINT notlar_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE CASCADE;


--
-- Name: operator_belgeri operator_belgeri_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operator_belgeri
    ADD CONSTRAINT operator_belgeri_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE CASCADE;


--
-- Name: personel_belgeleri personel_belgeleri_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_belgeleri
    ADD CONSTRAINT personel_belgeleri_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE CASCADE;


--
-- Name: personel_dosyasi personel_dosyasi_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_dosyasi
    ADD CONSTRAINT personel_dosyasi_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE CASCADE;


--
-- Name: personel personel_ekip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel
    ADD CONSTRAINT personel_ekip_id_fkey FOREIGN KEY (ekip_id) REFERENCES public.ekipler(id) ON DELETE SET NULL;


--
-- Name: personel_myk_egitimleri personel_myk_egitimleri_myk_egitim_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_myk_egitimleri
    ADD CONSTRAINT personel_myk_egitimleri_myk_egitim_id_fkey FOREIGN KEY (myk_egitim_id) REFERENCES public.myk_egitim_listesi(id) ON DELETE CASCADE;


--
-- Name: personel_myk_egitimleri personel_myk_egitimleri_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_myk_egitimleri
    ADD CONSTRAINT personel_myk_egitimleri_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE CASCADE;


--
-- Name: personel_santiyeler personel_santiyeler_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_santiyeler
    ADD CONSTRAINT personel_santiyeler_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE CASCADE;


--
-- Name: personel_santiyeler personel_santiyeler_santiye_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_santiyeler
    ADD CONSTRAINT personel_santiyeler_santiye_id_fkey FOREIGN KEY (santiye_id) REFERENCES public.santiyeler(id) ON DELETE CASCADE;


--
-- Name: personel_talimat_matrisi personel_talimat_matrisi_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel_talimat_matrisi
    ADD CONSTRAINT personel_talimat_matrisi_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE CASCADE;


--
-- Name: personel personel_taseron_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personel
    ADD CONSTRAINT personel_taseron_id_fkey FOREIGN KEY (taseron_id) REFERENCES public.taseronlar(id) ON DELETE SET NULL;


--
-- Name: psikososyal_risk_degerlendirme psikososyal_risk_degerlendirme_santiye_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.psikososyal_risk_degerlendirme
    ADD CONSTRAINT psikososyal_risk_degerlendirme_santiye_id_fkey FOREIGN KEY (santiye_id) REFERENCES public.santiyeler(id) ON DELETE SET NULL;


--
-- Name: risk_degerlendirme risk_degerlendirme_santiye_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_degerlendirme
    ADD CONSTRAINT risk_degerlendirme_santiye_id_fkey FOREIGN KEY (santiye_id) REFERENCES public.santiyeler(id) ON DELETE SET NULL;


--
-- Name: saha_sorumlulari saha_sorumlulari_santiye_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saha_sorumlulari
    ADD CONSTRAINT saha_sorumlulari_santiye_id_fkey FOREIGN KEY (santiye_id) REFERENCES public.santiyeler(id);


--
-- Name: taseron_sorumlulari taseron_sorumlulari_taseron_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taseron_sorumlulari
    ADD CONSTRAINT taseron_sorumlulari_taseron_id_fkey FOREIGN KEY (taseron_id) REFERENCES public.taseronlar(id) ON DELETE CASCADE;


--
-- Name: taseronlar taseronlar_santiye_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.taseronlar
    ADD CONSTRAINT taseronlar_santiye_id_fkey FOREIGN KEY (santiye_id) REFERENCES public.santiyeler(id);


--
-- Name: yetkinlik_matrisi yetkinlik_matrisi_personel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yetkinlik_matrisi
    ADD CONSTRAINT yetkinlik_matrisi_personel_id_fkey FOREIGN KEY (personel_id) REFERENCES public.personel(id) ON DELETE CASCADE;


--
-- Name: acil_durum Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.acil_durum FOR INSERT WITH CHECK (true);


--
-- Name: ai_risk_suggestions Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.ai_risk_suggestions FOR INSERT WITH CHECK (true);


--
-- Name: audit_log Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.audit_log FOR INSERT WITH CHECK (true);


--
-- Name: ayarlar Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.ayarlar FOR INSERT WITH CHECK (true);


--
-- Name: baglam_analizi Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.baglam_analizi FOR INSERT WITH CHECK (true);


--
-- Name: data_quality_metrics Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.data_quality_metrics FOR INSERT WITH CHECK (true);


--
-- Name: data_transfer_log Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.data_transfer_log FOR INSERT WITH CHECK (true);


--
-- Name: denetim_bulgulari Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.denetim_bulgulari FOR INSERT WITH CHECK (true);


--
-- Name: dokuman_kontrol Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.dokuman_kontrol FOR INSERT WITH CHECK (true);


--
-- Name: duzeltici_faaliyet Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.duzeltici_faaliyet FOR INSERT WITH CHECK (true);


--
-- Name: egitimler Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.egitimler FOR INSERT WITH CHECK (true);


--
-- Name: ekipler Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.ekipler FOR INSERT WITH CHECK (true);


--
-- Name: encryption_keys Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.encryption_keys FOR INSERT WITH CHECK (true);


--
-- Name: hibrit_calisma_ergonomi Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.hibrit_calisma_ergonomi FOR INSERT WITH CHECK (true);


--
-- Name: ic_denetim Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.ic_denetim FOR INSERT WITH CHECK (true);


--
-- Name: ihtar_dosyalari Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.ihtar_dosyalari FOR INSERT WITH CHECK (true);


--
-- Name: ihtar_tutanagi Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.ihtar_tutanagi FOR INSERT WITH CHECK (true);


--
-- Name: iletisim_kaydi Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.iletisim_kaydi FOR INSERT WITH CHECK (true);


--
-- Name: is_ekipmanlari Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.is_ekipmanlari FOR INSERT WITH CHECK (true);


--
-- Name: is_kazalari Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.is_kazalari FOR INSERT WITH CHECK (true);


--
-- Name: isci_katilimi Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.isci_katilimi FOR INSERT WITH CHECK (true);


--
-- Name: kvkk_consents Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.kvkk_consents FOR INSERT WITH CHECK (true);


--
-- Name: myk_belgeri Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.myk_belgeri FOR INSERT WITH CHECK (true);


--
-- Name: myk_egitim_listesi Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.myk_egitim_listesi FOR INSERT WITH CHECK (true);


--
-- Name: ohs_hedefleri Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.ohs_hedefleri FOR INSERT WITH CHECK (true);


--
-- Name: operator_belgeri Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.operator_belgeri FOR INSERT WITH CHECK (true);


--
-- Name: performans_izleme Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.performans_izleme FOR INSERT WITH CHECK (true);


--
-- Name: personel Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.personel FOR INSERT WITH CHECK (true);


--
-- Name: personel_belgeleri Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.personel_belgeleri FOR INSERT WITH CHECK (true);


--
-- Name: personel_dosyasi Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.personel_dosyasi FOR INSERT WITH CHECK (true);


--
-- Name: personel_myk_egitimleri Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.personel_myk_egitimleri FOR INSERT WITH CHECK (true);


--
-- Name: personel_santiyeler Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.personel_santiyeler FOR INSERT WITH CHECK (true);


--
-- Name: politika_yonetimi Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.politika_yonetimi FOR INSERT WITH CHECK (true);


--
-- Name: psikososyal_risk_degerlendirme Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.psikososyal_risk_degerlendirme FOR INSERT WITH CHECK (true);


--
-- Name: risk_degerlendirme Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.risk_degerlendirme FOR INSERT WITH CHECK (true);


--
-- Name: saha_sorumlulari Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.saha_sorumlulari FOR INSERT WITH CHECK (true);


--
-- Name: santiyeler Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.santiyeler FOR INSERT WITH CHECK (true);


--
-- Name: talimatlar Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.talimatlar FOR INSERT WITH CHECK (true);


--
-- Name: taseronlar Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.taseronlar FOR INSERT WITH CHECK (true);


--
-- Name: versiyonlar Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.versiyonlar FOR INSERT WITH CHECK (true);


--
-- Name: yasal_uygunluk Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.yasal_uygunluk FOR INSERT WITH CHECK (true);


--
-- Name: yedekleme_log Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.yedekleme_log FOR INSERT WITH CHECK (true);


--
-- Name: yetkinlik_matrisi Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.yetkinlik_matrisi FOR INSERT WITH CHECK (true);


--
-- Name: yonetim_gozden_gecirme Herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes ekleyebilir" ON public.yonetim_gozden_gecirme FOR INSERT WITH CHECK (true);


--
-- Name: acil_durum Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.acil_durum FOR UPDATE USING (true);


--
-- Name: ai_risk_suggestions Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.ai_risk_suggestions FOR UPDATE USING (true);


--
-- Name: baglam_analizi Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.baglam_analizi FOR UPDATE USING (true);


--
-- Name: data_quality_metrics Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.data_quality_metrics FOR UPDATE USING (true);


--
-- Name: data_transfer_log Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.data_transfer_log FOR UPDATE USING (true);


--
-- Name: denetim_bulgulari Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.denetim_bulgulari FOR UPDATE USING (true);


--
-- Name: dokuman_kontrol Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.dokuman_kontrol FOR UPDATE USING (true);


--
-- Name: duzeltici_faaliyet Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.duzeltici_faaliyet FOR UPDATE USING (true);


--
-- Name: egitimler Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.egitimler FOR UPDATE USING (true);


--
-- Name: ekipler Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.ekipler FOR UPDATE USING (true);


--
-- Name: encryption_keys Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.encryption_keys FOR UPDATE USING (true);


--
-- Name: hibrit_calisma_ergonomi Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.hibrit_calisma_ergonomi FOR UPDATE USING (true);


--
-- Name: ic_denetim Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.ic_denetim FOR UPDATE USING (true);


--
-- Name: ihtar_dosyalari Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.ihtar_dosyalari FOR UPDATE USING (true);


--
-- Name: ihtar_tutanagi Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.ihtar_tutanagi FOR UPDATE USING (true);


--
-- Name: iletisim_kaydi Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.iletisim_kaydi FOR UPDATE USING (true);


--
-- Name: is_ekipmanlari Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.is_ekipmanlari FOR UPDATE USING (true);


--
-- Name: is_kazalari Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.is_kazalari FOR UPDATE USING (true);


--
-- Name: isci_katilimi Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.isci_katilimi FOR UPDATE USING (true);


--
-- Name: kvkk_consents Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.kvkk_consents FOR UPDATE USING (true);


--
-- Name: myk_belgeri Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.myk_belgeri FOR UPDATE USING (true);


--
-- Name: ohs_hedefleri Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.ohs_hedefleri FOR UPDATE USING (true);


--
-- Name: operator_belgeri Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.operator_belgeri FOR UPDATE USING (true);


--
-- Name: performans_izleme Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.performans_izleme FOR UPDATE USING (true);


--
-- Name: personel Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.personel FOR UPDATE USING (true);


--
-- Name: personel_belgeleri Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.personel_belgeleri FOR UPDATE USING (true);


--
-- Name: personel_dosyasi Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.personel_dosyasi FOR UPDATE USING (true);


--
-- Name: politika_yonetimi Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.politika_yonetimi FOR UPDATE USING (true);


--
-- Name: psikososyal_risk_degerlendirme Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.psikososyal_risk_degerlendirme FOR UPDATE USING (true);


--
-- Name: risk_degerlendirme Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.risk_degerlendirme FOR UPDATE USING (true);


--
-- Name: saha_sorumlulari Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.saha_sorumlulari FOR UPDATE USING (true);


--
-- Name: santiyeler Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.santiyeler FOR UPDATE USING (true);


--
-- Name: talimatlar Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.talimatlar FOR UPDATE USING (true);


--
-- Name: taseronlar Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.taseronlar FOR UPDATE USING (true);


--
-- Name: versiyonlar Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.versiyonlar FOR UPDATE USING (true);


--
-- Name: yasal_uygunluk Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.yasal_uygunluk FOR UPDATE USING (true);


--
-- Name: yetkinlik_matrisi Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.yetkinlik_matrisi FOR UPDATE USING (true);


--
-- Name: yonetim_gozden_gecirme Herkes guncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes guncelleyebilir" ON public.yonetim_gozden_gecirme FOR UPDATE USING (true);


--
-- Name: ayarlar Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.ayarlar FOR UPDATE USING (true);


--
-- Name: egitimler Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.egitimler FOR UPDATE USING (true);


--
-- Name: is_ekipmanlari Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.is_ekipmanlari FOR UPDATE USING (true);


--
-- Name: is_kazalari Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.is_kazalari FOR UPDATE USING (true);


--
-- Name: myk_belgeri Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.myk_belgeri FOR UPDATE USING (true);


--
-- Name: myk_egitim_listesi Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.myk_egitim_listesi FOR UPDATE USING (true);


--
-- Name: operator_belgeri Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.operator_belgeri FOR UPDATE USING (true);


--
-- Name: personel Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.personel FOR UPDATE USING (true);


--
-- Name: personel_dosyasi Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.personel_dosyasi FOR UPDATE USING (true);


--
-- Name: personel_myk_egitimleri Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.personel_myk_egitimleri FOR UPDATE USING (true);


--
-- Name: saha_sorumlulari Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.saha_sorumlulari FOR UPDATE USING (true);


--
-- Name: talimatlar Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.talimatlar FOR UPDATE USING (true);


--
-- Name: taseronlar Herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes güncelleyebilir" ON public.taseronlar FOR UPDATE USING (true);


--
-- Name: acil_durum Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.acil_durum FOR SELECT USING (true);


--
-- Name: ai_risk_suggestions Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.ai_risk_suggestions FOR SELECT USING (true);


--
-- Name: audit_log Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.audit_log FOR SELECT USING (true);


--
-- Name: ayarlar Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.ayarlar FOR SELECT USING (true);


--
-- Name: baglam_analizi Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.baglam_analizi FOR SELECT USING (true);


--
-- Name: data_quality_metrics Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.data_quality_metrics FOR SELECT USING (true);


--
-- Name: data_transfer_log Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.data_transfer_log FOR SELECT USING (true);


--
-- Name: denetim_bulgulari Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.denetim_bulgulari FOR SELECT USING (true);


--
-- Name: dokuman_kontrol Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.dokuman_kontrol FOR SELECT USING (true);


--
-- Name: duzeltici_faaliyet Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.duzeltici_faaliyet FOR SELECT USING (true);


--
-- Name: egitimler Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.egitimler FOR SELECT USING (true);


--
-- Name: ekipler Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.ekipler FOR SELECT USING (true);


--
-- Name: encryption_keys Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.encryption_keys FOR SELECT USING (true);


--
-- Name: hibrit_calisma_ergonomi Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.hibrit_calisma_ergonomi FOR SELECT USING (true);


--
-- Name: ic_denetim Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.ic_denetim FOR SELECT USING (true);


--
-- Name: ihtar_dosyalari Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.ihtar_dosyalari FOR SELECT USING (true);


--
-- Name: ihtar_tutanagi Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.ihtar_tutanagi FOR SELECT USING (true);


--
-- Name: iletisim_kaydi Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.iletisim_kaydi FOR SELECT USING (true);


--
-- Name: is_ekipmanlari Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.is_ekipmanlari FOR SELECT USING (true);


--
-- Name: is_kazalari Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.is_kazalari FOR SELECT USING (true);


--
-- Name: isci_katilimi Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.isci_katilimi FOR SELECT USING (true);


--
-- Name: kvkk_consents Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.kvkk_consents FOR SELECT USING (true);


--
-- Name: myk_belgeri Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.myk_belgeri FOR SELECT USING (true);


--
-- Name: myk_egitim_listesi Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.myk_egitim_listesi FOR SELECT USING (true);


--
-- Name: ohs_hedefleri Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.ohs_hedefleri FOR SELECT USING (true);


--
-- Name: operator_belgeri Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.operator_belgeri FOR SELECT USING (true);


--
-- Name: performans_izleme Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.performans_izleme FOR SELECT USING (true);


--
-- Name: personel Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.personel FOR SELECT USING (true);


--
-- Name: personel_belgeleri Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.personel_belgeleri FOR SELECT USING (true);


--
-- Name: personel_dosyasi Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.personel_dosyasi FOR SELECT USING (true);


--
-- Name: personel_myk_egitimleri Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.personel_myk_egitimleri FOR SELECT USING (true);


--
-- Name: personel_santiyeler Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.personel_santiyeler FOR SELECT USING (true);


--
-- Name: politika_yonetimi Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.politika_yonetimi FOR SELECT USING (true);


--
-- Name: psikososyal_risk_degerlendirme Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.psikososyal_risk_degerlendirme FOR SELECT USING (true);


--
-- Name: risk_degerlendirme Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.risk_degerlendirme FOR SELECT USING (true);


--
-- Name: saha_sorumlulari Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.saha_sorumlulari FOR SELECT USING (true);


--
-- Name: santiyeler Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.santiyeler FOR SELECT USING (true);


--
-- Name: talimatlar Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.talimatlar FOR SELECT USING (true);


--
-- Name: taseronlar Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.taseronlar FOR SELECT USING (true);


--
-- Name: versiyonlar Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.versiyonlar FOR SELECT USING (true);


--
-- Name: yasal_uygunluk Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.yasal_uygunluk FOR SELECT USING (true);


--
-- Name: yedekleme_log Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.yedekleme_log FOR SELECT USING (true);


--
-- Name: yetkinlik_matrisi Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.yetkinlik_matrisi FOR SELECT USING (true);


--
-- Name: yonetim_gozden_gecirme Herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes okuyabilir" ON public.yonetim_gozden_gecirme FOR SELECT USING (true);


--
-- Name: acil_durum Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.acil_durum FOR DELETE USING (true);


--
-- Name: ai_risk_suggestions Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.ai_risk_suggestions FOR DELETE USING (true);


--
-- Name: baglam_analizi Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.baglam_analizi FOR DELETE USING (true);


--
-- Name: data_quality_metrics Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.data_quality_metrics FOR DELETE USING (true);


--
-- Name: denetim_bulgulari Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.denetim_bulgulari FOR DELETE USING (true);


--
-- Name: dokuman_kontrol Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.dokuman_kontrol FOR DELETE USING (true);


--
-- Name: duzeltici_faaliyet Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.duzeltici_faaliyet FOR DELETE USING (true);


--
-- Name: egitimler Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.egitimler FOR DELETE USING (true);


--
-- Name: ekipler Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.ekipler FOR DELETE USING (true);


--
-- Name: encryption_keys Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.encryption_keys FOR DELETE USING (true);


--
-- Name: hibrit_calisma_ergonomi Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.hibrit_calisma_ergonomi FOR DELETE USING (true);


--
-- Name: ic_denetim Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.ic_denetim FOR DELETE USING (true);


--
-- Name: ihtar_dosyalari Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.ihtar_dosyalari FOR DELETE USING (true);


--
-- Name: ihtar_tutanagi Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.ihtar_tutanagi FOR DELETE USING (true);


--
-- Name: iletisim_kaydi Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.iletisim_kaydi FOR DELETE USING (true);


--
-- Name: is_ekipmanlari Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.is_ekipmanlari FOR DELETE USING (true);


--
-- Name: is_kazalari Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.is_kazalari FOR DELETE USING (true);


--
-- Name: isci_katilimi Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.isci_katilimi FOR DELETE USING (true);


--
-- Name: myk_belgeri Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.myk_belgeri FOR DELETE USING (true);


--
-- Name: myk_egitim_listesi Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.myk_egitim_listesi FOR DELETE USING (true);


--
-- Name: ohs_hedefleri Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.ohs_hedefleri FOR DELETE USING (true);


--
-- Name: operator_belgeri Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.operator_belgeri FOR DELETE USING (true);


--
-- Name: performans_izleme Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.performans_izleme FOR DELETE USING (true);


--
-- Name: personel Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.personel FOR DELETE USING (true);


--
-- Name: personel_belgeleri Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.personel_belgeleri FOR DELETE USING (true);


--
-- Name: personel_dosyasi Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.personel_dosyasi FOR DELETE USING (true);


--
-- Name: personel_myk_egitimleri Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.personel_myk_egitimleri FOR DELETE USING (true);


--
-- Name: personel_santiyeler Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.personel_santiyeler FOR DELETE USING (true);


--
-- Name: politika_yonetimi Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.politika_yonetimi FOR DELETE USING (true);


--
-- Name: psikososyal_risk_degerlendirme Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.psikososyal_risk_degerlendirme FOR DELETE USING (true);


--
-- Name: risk_degerlendirme Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.risk_degerlendirme FOR DELETE USING (true);


--
-- Name: saha_sorumlulari Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.saha_sorumlulari FOR DELETE USING (true);


--
-- Name: santiyeler Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.santiyeler FOR DELETE USING (true);


--
-- Name: talimatlar Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.talimatlar FOR DELETE USING (true);


--
-- Name: taseronlar Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.taseronlar FOR DELETE USING (true);


--
-- Name: versiyonlar Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.versiyonlar FOR DELETE USING (true);


--
-- Name: yasal_uygunluk Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.yasal_uygunluk FOR DELETE USING (true);


--
-- Name: yetkinlik_matrisi Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.yetkinlik_matrisi FOR DELETE USING (true);


--
-- Name: yonetim_gozden_gecirme Herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes silebilir" ON public.yonetim_gozden_gecirme FOR DELETE USING (true);


--
-- Name: notlar Notlar tablosuna herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Notlar tablosuna herkes ekleyebilir" ON public.notlar FOR INSERT WITH CHECK (true);


--
-- Name: notlar Notlar tablosundan herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Notlar tablosundan herkes silebilir" ON public.notlar FOR DELETE USING (true);


--
-- Name: notlar Notlar tablosunu herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Notlar tablosunu herkes güncelleyebilir" ON public.notlar FOR UPDATE USING (true);


--
-- Name: notlar Notlar tablosunu herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Notlar tablosunu herkes okuyabilir" ON public.notlar FOR SELECT USING (true);


--
-- Name: personel Personel tablosuna herkes ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Personel tablosuna herkes ekleyebilir" ON public.personel FOR INSERT WITH CHECK (true);


--
-- Name: personel Personel tablosundan herkes silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Personel tablosundan herkes silebilir" ON public.personel FOR DELETE USING (true);


--
-- Name: personel Personel tablosunu herkes güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Personel tablosunu herkes güncelleyebilir" ON public.personel FOR UPDATE USING (true);


--
-- Name: personel Personel tablosunu herkes okuyabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Personel tablosunu herkes okuyabilir" ON public.personel FOR SELECT USING (true);


--
-- Name: taseron_sorumlulari Public access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public access" ON public.taseron_sorumlulari USING (true) WITH CHECK (true);


--
-- Name: ai_risk_suggestions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_risk_suggestions ENABLE ROW LEVEL SECURITY;

--
-- Name: birimler anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anon_all ON public.birimler TO anon USING (true) WITH CHECK (true);


--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: ayarlar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ayarlar ENABLE ROW LEVEL SECURITY;

--
-- Name: ayarlar ayarlar_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ayarlar_delete ON public.ayarlar FOR DELETE USING (true);


--
-- Name: ayarlar ayarlar_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ayarlar_insert ON public.ayarlar FOR INSERT WITH CHECK (true);


--
-- Name: ayarlar ayarlar_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ayarlar_select ON public.ayarlar FOR SELECT USING (true);


--
-- Name: ayarlar ayarlar_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ayarlar_update ON public.ayarlar FOR UPDATE USING (true);


--
-- Name: baglam_analizi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.baglam_analizi ENABLE ROW LEVEL SECURITY;

--
-- Name: birimler; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.birimler ENABLE ROW LEVEL SECURITY;

--
-- Name: data_quality_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_quality_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: data_transfer_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_transfer_log ENABLE ROW LEVEL SECURITY;

--
-- Name: egitim_dosyalari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.egitim_dosyalari ENABLE ROW LEVEL SECURITY;

--
-- Name: egitim_dosyalari egitim_dosyalari_public_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY egitim_dosyalari_public_delete ON public.egitim_dosyalari FOR DELETE USING (true);


--
-- Name: egitim_dosyalari egitim_dosyalari_public_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY egitim_dosyalari_public_insert ON public.egitim_dosyalari FOR INSERT WITH CHECK (true);


--
-- Name: egitim_dosyalari egitim_dosyalari_public_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY egitim_dosyalari_public_select ON public.egitim_dosyalari FOR SELECT USING (true);


--
-- Name: egitim_dosyalari egitim_dosyalari_public_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY egitim_dosyalari_public_update ON public.egitim_dosyalari FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: egitim_katilimcilar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.egitim_katilimcilar ENABLE ROW LEVEL SECURITY;

--
-- Name: egitim_kayitlari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.egitim_kayitlari ENABLE ROW LEVEL SECURITY;

--
-- Name: egitim_tanimlari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.egitim_tanimlari ENABLE ROW LEVEL SECURITY;

--
-- Name: egitim_yer_tanimlari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.egitim_yer_tanimlari ENABLE ROW LEVEL SECURITY;

--
-- Name: egitimler; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.egitimler ENABLE ROW LEVEL SECURITY;

--
-- Name: egitmen_tanimlari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.egitmen_tanimlari ENABLE ROW LEVEL SECURITY;

--
-- Name: ekipler; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ekipler ENABLE ROW LEVEL SECURITY;

--
-- Name: ekipman_dosyalari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ekipman_dosyalari ENABLE ROW LEVEL SECURITY;

--
-- Name: ekipman_dosyalari ekipman_dosyalari_public_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ekipman_dosyalari_public_all ON public.ekipman_dosyalari USING (true) WITH CHECK (true);


--
-- Name: encryption_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: hibrit_calisma_ergonomi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hibrit_calisma_ergonomi ENABLE ROW LEVEL SECURITY;

--
-- Name: iletisim_kaydi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.iletisim_kaydi ENABLE ROW LEVEL SECURITY;

--
-- Name: is_ekipmanlari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.is_ekipmanlari ENABLE ROW LEVEL SECURITY;

--
-- Name: is_kazalari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.is_kazalari ENABLE ROW LEVEL SECURITY;

--
-- Name: isci_katilimi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.isci_katilimi ENABLE ROW LEVEL SECURITY;

--
-- Name: kvkk_consents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kvkk_consents ENABLE ROW LEVEL SECURITY;

--
-- Name: myk_belgeri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.myk_belgeri ENABLE ROW LEVEL SECURITY;

--
-- Name: myk_egitim_listesi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.myk_egitim_listesi ENABLE ROW LEVEL SECURITY;

--
-- Name: notlar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notlar ENABLE ROW LEVEL SECURITY;

--
-- Name: ohs_hedefleri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ohs_hedefleri ENABLE ROW LEVEL SECURITY;

--
-- Name: operator_belgeri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.operator_belgeri ENABLE ROW LEVEL SECURITY;

--
-- Name: personel; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.personel ENABLE ROW LEVEL SECURITY;

--
-- Name: personel_dosyasi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.personel_dosyasi ENABLE ROW LEVEL SECURITY;

--
-- Name: personel_myk_egitimleri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.personel_myk_egitimleri ENABLE ROW LEVEL SECURITY;

--
-- Name: personel_santiyeler; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.personel_santiyeler ENABLE ROW LEVEL SECURITY;

--
-- Name: politika_yonetimi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.politika_yonetimi ENABLE ROW LEVEL SECURITY;

--
-- Name: psikososyal_risk_degerlendirme; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.psikososyal_risk_degerlendirme ENABLE ROW LEVEL SECURITY;

--
-- Name: egitim_katilimcilar public_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_all ON public.egitim_katilimcilar USING (true) WITH CHECK (true);


--
-- Name: egitim_kayitlari public_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_all ON public.egitim_kayitlari USING (true) WITH CHECK (true);


--
-- Name: egitim_tanimlari public_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_all ON public.egitim_tanimlari USING (true) WITH CHECK (true);


--
-- Name: egitim_yer_tanimlari public_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_all ON public.egitim_yer_tanimlari USING (true) WITH CHECK (true);


--
-- Name: egitmen_tanimlari public_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_all ON public.egitmen_tanimlari USING (true) WITH CHECK (true);


--
-- Name: saha_sorumlulari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saha_sorumlulari ENABLE ROW LEVEL SECURITY;

--
-- Name: santiyeler; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.santiyeler ENABLE ROW LEVEL SECURITY;

--
-- Name: talimatlar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.talimatlar ENABLE ROW LEVEL SECURITY;

--
-- Name: taseron_sorumlulari; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.taseron_sorumlulari ENABLE ROW LEVEL SECURITY;

--
-- Name: taseronlar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.taseronlar ENABLE ROW LEVEL SECURITY;

--
-- Name: yedekleme_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.yedekleme_log ENABLE ROW LEVEL SECURITY;

--

--
-- PostgreSQL database dump complete
--

-- ============================================================
-- ISGAPP SELF-HOST EXTENSIONS (canlı Supabase'tan senkronize)
-- ============================================================

-- ------------------------------------------------------------
-- 1) STORAGE BUCKETS (isgapp bucket'ları, public=true, limitsiz)
--    Not: `kamera` bucket'ı kolla modülüne ait olduğundan dahil edilmedi.
-- ------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('ihtar-dosyalari', 'ihtar-dosyalari', TRUE, NULL, NULL),
  ('personel-belgeleri', 'personel-belgeleri', TRUE, NULL, NULL),
  ('egitim-dosyalari', 'egitim-dosyalari', TRUE, NULL, NULL),
  ('ekipman-dosyalari', 'ekipman-dosyalari', TRUE, NULL, NULL),
  ('kaza-dosyalari', 'kaza-dosyalari', TRUE, NULL, NULL),
  ('santiye-dosyalari', 'santiye-dosyalari', TRUE, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------
-- 2) STORAGE.OBJECTS RLS POLICY'LERİ (canlı DB'deki ile birebir)
--    Kamera dışındaki tüm isgapp bucket'ları — herkes erişebilir (public dev modu)
-- ------------------------------------------------------------

-- ihtar-dosyalari
DROP POLICY IF EXISTS "Herkes ihtar dosyalarını okuyabilir" ON storage.objects;
CREATE POLICY "Herkes ihtar dosyalarını okuyabilir" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'ihtar-dosyalari');
DROP POLICY IF EXISTS "Herkes ihtar dosyası güncelleyebilir" ON storage.objects;
CREATE POLICY "Herkes ihtar dosyası güncelleyebilir" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'ihtar-dosyalari');
DROP POLICY IF EXISTS "Herkes ihtar dosyası silebilir" ON storage.objects;
CREATE POLICY "Herkes ihtar dosyası silebilir" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'ihtar-dosyalari');
DROP POLICY IF EXISTS "Herkes ihtar dosyası yükleyebilir" ON storage.objects;
CREATE POLICY "Herkes ihtar dosyası yükleyebilir" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'ihtar-dosyalari');

-- personel-belgeleri
DROP POLICY IF EXISTS "Herkes personel belgelerini okuyabilir" ON storage.objects;
CREATE POLICY "Herkes personel belgelerini okuyabilir" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'personel-belgeleri');
DROP POLICY IF EXISTS "Herkes personel belgesi güncelleyebilir" ON storage.objects;
CREATE POLICY "Herkes personel belgesi güncelleyebilir" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'personel-belgeleri');
DROP POLICY IF EXISTS "Herkes personel belgesi silebilir" ON storage.objects;
CREATE POLICY "Herkes personel belgesi silebilir" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'personel-belgeleri');
DROP POLICY IF EXISTS "Herkes personel belgesi yükleyebilir" ON storage.objects;
CREATE POLICY "Herkes personel belgesi yükleyebilir" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'personel-belgeleri');

-- egitim-dosyalari
DROP POLICY IF EXISTS "egitim_dosyalari_public_select" ON storage.objects;
CREATE POLICY "egitim_dosyalari_public_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'egitim-dosyalari');
DROP POLICY IF EXISTS "egitim_dosyalari_public_insert" ON storage.objects;
CREATE POLICY "egitim_dosyalari_public_insert" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'egitim-dosyalari');
DROP POLICY IF EXISTS "egitim_dosyalari_public_update" ON storage.objects;
CREATE POLICY "egitim_dosyalari_public_update" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'egitim-dosyalari') WITH CHECK (bucket_id = 'egitim-dosyalari');
DROP POLICY IF EXISTS "egitim_dosyalari_public_delete" ON storage.objects;
CREATE POLICY "egitim_dosyalari_public_delete" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'egitim-dosyalari');

-- ekipman-dosyalari
DROP POLICY IF EXISTS "ekipman_dosyalari_public_select" ON storage.objects;
CREATE POLICY "ekipman_dosyalari_public_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'ekipman-dosyalari');
DROP POLICY IF EXISTS "ekipman_dosyalari_public_insert" ON storage.objects;
CREATE POLICY "ekipman_dosyalari_public_insert" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'ekipman-dosyalari');
DROP POLICY IF EXISTS "ekipman_dosyalari_public_update" ON storage.objects;
CREATE POLICY "ekipman_dosyalari_public_update" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'ekipman-dosyalari') WITH CHECK (bucket_id = 'ekipman-dosyalari');
DROP POLICY IF EXISTS "ekipman_dosyalari_public_delete" ON storage.objects;
CREATE POLICY "ekipman_dosyalari_public_delete" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'ekipman-dosyalari');

-- kaza-dosyalari
DROP POLICY IF EXISTS "kaza_dosyalari_public_select" ON storage.objects;
CREATE POLICY "kaza_dosyalari_public_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'kaza-dosyalari');
DROP POLICY IF EXISTS "kaza_dosyalari_public_insert" ON storage.objects;
CREATE POLICY "kaza_dosyalari_public_insert" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'kaza-dosyalari');
DROP POLICY IF EXISTS "kaza_dosyalari_public_update" ON storage.objects;
CREATE POLICY "kaza_dosyalari_public_update" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'kaza-dosyalari') WITH CHECK (bucket_id = 'kaza-dosyalari');
DROP POLICY IF EXISTS "kaza_dosyalari_public_delete" ON storage.objects;
CREATE POLICY "kaza_dosyalari_public_delete" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'kaza-dosyalari');

-- santiye-dosyalari
DROP POLICY IF EXISTS "santiye_dosyalari_public_select" ON storage.objects;
CREATE POLICY "santiye_dosyalari_public_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'santiye-dosyalari');
DROP POLICY IF EXISTS "santiye_dosyalari_public_insert" ON storage.objects;
CREATE POLICY "santiye_dosyalari_public_insert" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'santiye-dosyalari');
DROP POLICY IF EXISTS "santiye_dosyalari_public_update" ON storage.objects;
CREATE POLICY "santiye_dosyalari_public_update" ON storage.objects
  FOR UPDATE TO public USING (bucket_id = 'santiye-dosyalari') WITH CHECK (bucket_id = 'santiye-dosyalari');
DROP POLICY IF EXISTS "santiye_dosyalari_public_delete" ON storage.objects;
CREATE POLICY "santiye_dosyalari_public_delete" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'santiye-dosyalari');

-- ------------------------------------------------------------
-- 3) GRANT'LAR — canlı DB'deki ACL ile birebir
--    (anon, authenticated, service_role: tüm tablolarda arwdDxtm)
-- ------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storage TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 4) GİRİŞ SİSTEMİ TABLOLARI (app_users / app_sessions)
--    RLS deny-all: policy EKİLMEZ, anon key satır göremez.
--    Auth API route'ları doğrudan pg (DATABASE_URL) ile erişir.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.app_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    salt text NOT NULL,
    ad_soyad text,
    rol text NOT NULL DEFAULT 'kullanici',
    aktif boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.app_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_sessions_token ON public.app_sessions(token);
CREATE INDEX IF NOT EXISTS idx_app_sessions_user ON public.app_sessions(user_id);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;
