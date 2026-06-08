# Sequence Diagram Campren

Dokumen ini memetakan alur utama aplikasi berdasarkan kode frontend, backend
Spring Boot, repository JPA, dan skema database yang ada di repository.

## 1. Arsitektur Umum

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Frontend HTML/JavaScript
    participant LS as LocalStorage
    participant SEC as Spring SecurityFilterChain
    participant API as AuthController /api
    participant REPO as Spring Data JPA Repository
    participant DB as MariaDB

    User->>UI: Membuka atau menggunakan halaman
    UI->>LS: Membaca data user saat dibutuhkan
    opt Halaman membutuhkan data backend
        UI->>SEC: HTTP request ke Azure backend
        SEC->>API: Request diizinkan
        API->>REPO: Memanggil operasi repository
        REPO->>DB: Menjalankan query
        DB-->>REPO: Hasil query
        REPO-->>API: Entity atau daftar entity
        API-->>UI: Text atau JSON response
        UI-->>User: Render hasil atau pesan
    end
```

> `SecurityConfig` menonaktifkan CSRF dan mengizinkan seluruh request.
> Controller berinteraksi langsung dengan repository karena belum ada service
> layer terpisah.

## 2. Registrasi Pengguna

Sumber: `frontend/Registrasi/script.js` dan `POST /api/register`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant REG as Halaman Registrasi
    participant API as AuthController
    participant PR as PelangganRepository
    participant UR as UsersRepository
    participant DB as MariaDB
    participant LOGIN as Halaman Login

    User->>REG: Mengisi nama, email, password, konfirmasi
    REG->>REG: Validasi field, format email, dan password

    alt Data form tidak valid
        REG-->>User: Tampilkan pesan validasi
    else Data form valid
        REG->>API: POST /api/register
        Note right of REG: Body: nama, email, password
        API->>PR: existsByEmail(email)
        PR->>DB: SELECT pelanggan berdasarkan email
        DB-->>PR: Status keberadaan email

        alt Email sudah terdaftar
            PR-->>API: true
            API-->>REG: "email exists"
            REG-->>User: Tampilkan email sudah digunakan
        else Email belum terdaftar
            PR-->>API: false
            API->>PR: save(Pelanggan)
            PR->>DB: INSERT pelanggan
            DB-->>PR: Pelanggan tersimpan

            API->>API: Buat Users dengan roleId = 1
            API->>UR: save(Users)
            UR->>DB: INSERT users
            DB-->>UR: User tersimpan
            UR-->>API: Entity Users
            API-->>REG: "registered"
            REG-->>User: Tampilkan registrasi berhasil
            REG->>LOGIN: Redirect ke Login/index.html
        end
    end
```

## 3. Login

Sumber: `frontend/Login/script.js` dan `POST /api/login`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant LOGIN as Halaman Login
    participant API as AuthController
    participant PR as PelangganRepository
    participant UR as UsersRepository
    participant DB as MariaDB
    participant LS as LocalStorage
    participant DASH as Halaman Dashboard

    User->>LOGIN: Mengisi email dan password
    LOGIN->>LOGIN: Validasi field wajib

    alt Field kosong
        LOGIN-->>User: Email dan password wajib diisi
    else Field terisi
        LOGIN->>API: POST /api/login
        Note right of LOGIN: Body: email, password
        API->>PR: findByEmail(email)
        PR->>DB: SELECT pelanggan
        DB-->>PR: Optional Pelanggan
        PR-->>API: Data akun

        alt Akun ditemukan dan password sama
            API->>UR: findByEmail(email)
            UR->>DB: SELECT users
            DB-->>UR: Optional Users
            UR-->>API: userId, email, nama

            alt Data Users ditemukan
                API-->>LOGIN: 200 JSON status registered
                LOGIN->>LS: setItem("user", response)
                LOGIN-->>User: Login berhasil
                LOGIN->>DASH: Redirect ke Dashboard/index.html
            else Data Users tidak ditemukan
                API-->>LOGIN: 401 status not registered
                LOGIN-->>User: Login gagal
            end
        else Email atau password salah
            API-->>LOGIN: 401 status not registered
            LOGIN-->>User: Email atau password salah
        end
    end
```

## 4. Reset Password

Sumber: `frontend/Resetpw/script.js` dan `PUT /api/change-password`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant RESET as Halaman Reset Password
    participant API as AuthController
    participant PR as PelangganRepository
    participant DB as MariaDB
    participant LS as LocalStorage
    participant SS as SessionStorage
    participant LOGIN as Halaman Login

    User->>RESET: Mengisi email, password baru, dan konfirmasi
    RESET->>RESET: Validasi email, kekuatan password, dan kecocokan

    alt Data tidak valid
        RESET-->>User: Tampilkan pesan validasi
    else Data valid
        RESET->>API: PUT /api/change-password
        Note right of RESET: Body: email, password baru
        API->>PR: findByEmail(email)
        PR->>DB: SELECT pelanggan
        DB-->>PR: Optional Pelanggan

        alt Email ditemukan
            PR-->>API: Pelanggan
            API->>API: setPassword(password baru)
            API->>PR: save(Pelanggan)
            PR->>DB: UPDATE pelanggan
            DB-->>PR: Data diperbarui
            API-->>RESET: "success"
            RESET->>LS: removeItem("user")
            RESET->>LS: removeItem("token")
            RESET->>SS: clear()
            RESET-->>User: Password berhasil diubah
            RESET->>LOGIN: Redirect ke Login/index.html
        else Email tidak ditemukan
            API-->>RESET: "email not found"
            RESET-->>User: Tampilkan email tidak ditemukan
        end
    end
```

## 5. Membuat Campaign

Sumber: `frontend/Input/script.js` dan `POST /api/campaign`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant INPUT as Form Input Campaign
    participant API as AuthController
    participant SYS as Sistem

    User->>INPUT: Mengisi detail campaign dan target
    activate INPUT
    INPUT->>INPUT: Menghitung preview ROAS dan CTR
    User->>INPUT: Klik simpan campaign
    INPUT->>INPUT: Memvalidasi data campaign

    alt Data campaign tidak valid
        INPUT-->>User: Menampilkan pesan validasi
    else Data campaign valid
        INPUT->>INPUT: Mengambil user dari LocalStorage

        alt User belum login
            INPUT-->>User: Menampilkan pesan user belum login
        else User sudah login
            INPUT->>API: createCampaign(dataCampaign)
            activate API
            API->>SYS: Menyimpan data campaign
            activate SYS

            alt Data berhasil disimpan
                SYS-->>API: Campaign tersimpan
                API-->>INPUT: Campaign created
                INPUT-->>User: Menampilkan pesan berhasil
            else Penyimpanan gagal
                SYS-->>API: Gagal menyimpan campaign
                API-->>INPUT: Failed
                INPUT-->>User: Menampilkan pesan gagal
            end
            deactivate SYS
            deactivate API
        end
    end
    deactivate INPUT
```

## 6. Memuat Dashboard

Sumber: `frontend/Dashboard/app.js`, `GET /api/GetUserCampaigns/{userId}`,
`GET /api/PerformanceReport/{id}`, dan `GET /api/roas/{id}`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant DASH as Dashboard
    participant API as AuthController
    participant SYS as Sistem

    User->>DASH: Membuka Dashboard
    activate DASH
    DASH->>DASH: Mengambil user dari LocalStorage

    alt User belum login
        DASH-->>User: Menampilkan pesan user belum login
    else User sudah login
        DASH->>API: getUserCampaigns(userId)
        activate API
        API->>SYS: Mengambil daftar campaign
        activate SYS
        SYS-->>API: Daftar campaign
        deactivate SYS
        API-->>DASH: Data campaign

        alt Campaign tidak tersedia
            DASH->>DASH: Mengosongkan KPI, tabel, dan chart
            DASH-->>User: Menampilkan dashboard tanpa data
        else Campaign tersedia
            loop Setiap campaign
                DASH->>API: getPerformanceReport(campaignId)
                API->>SYS: Mengambil campaign dan performance
                activate SYS
                SYS-->>API: Data campaign dan performance
                deactivate SYS
                API-->>DASH: Performance report

                DASH->>API: getMetrics(campaignId)
                API->>SYS: Mengambil performance metrics
                activate SYS
                SYS-->>API: Performance metrics
                deactivate SYS
                API->>API: Menghitung ROAS, CTR, dan CPC
                API-->>DASH: Data ROAS, CTR, dan CPC

                DASH->>DASH: Mengagregasi data campaign
            end

            DASH->>DASH: Menampilkan KPI, tabel, dan chart
            DASH-->>User: Dashboard berhasil ditampilkan
        end
        deactivate API
    end
    deactivate DASH
```

## 7. Mengedit Campaign

Sumber: `frontend/Dashboard/app.js` dan `PUT /api/campaign/{campaignId}`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant DASH as Dashboard
    participant API as AuthController
    participant CR as CampaignRepository
    participant DB as MariaDB

    User->>DASH: Klik edit campaign
    DASH->>DASH: Buka modal dan isi data campaign
    User->>DASH: Ubah data lalu konfirmasi
    DASH->>API: PUT /api/campaign/{campaignId}
    Note right of DASH: namaCampaign, budget, tanggalAkhir,<br/>targetClicks, targetIncome, targetViews
    API->>CR: findById(campaignId)
    CR->>DB: SELECT campaign
    DB-->>CR: Optional Campaign

    alt Campaign tidak ditemukan
        CR-->>API: Empty
        API-->>DASH: 404 Campaign not found
        DASH-->>User: Toast gagal edit
    else Campaign ditemukan
        CR-->>API: Campaign
        API->>API: Ubah field yang diizinkan
        API->>CR: save(Campaign)
        CR->>DB: UPDATE campaigns
        DB-->>CR: Campaign diperbarui
        API-->>DASH: 200 status success
        DASH->>DASH: Tutup modal
        DASH-->>User: Toast berhasil diedit
        DASH->>DASH: loadDashboard()
    end
```

## 8. Menghapus Campaign

Sumber: `frontend/Dashboard/app.js` dan `DELETE /api/campaign/{campaignId}`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant DASH as Dashboard
    participant API as AuthController
    participant CR as CampaignRepository
    participant PMR as PerformanceMetricsRepository
    participant DB as MariaDB

    User->>DASH: Klik hapus campaign
    DASH->>DASH: Buka modal konfirmasi
    User->>DASH: Konfirmasi hapus
    DASH->>API: DELETE /api/campaign/{campaignId}
    API->>CR: findById(campaignId)
    CR->>DB: SELECT campaign
    DB-->>CR: Optional Campaign

    alt Campaign tidak ditemukan
        CR-->>API: Empty
        API-->>DASH: 404 Campaign not found
        DASH-->>User: Toast gagal menghapus
    else Campaign ditemukan
        CR-->>API: Campaign
        API->>PMR: deleteByCampaignId(campaignId)
        PMR->>DB: DELETE performance_metrics
        DB-->>PMR: Metrics terhapus
        API->>CR: deleteById(campaignId)
        CR->>DB: DELETE campaigns
        DB-->>CR: Campaign terhapus
        API-->>DASH: 200 status success
        DASH->>DASH: Tutup modal
        DASH-->>User: Toast berhasil dihapus
        DASH->>DASH: loadDashboard()
    end
```

## 9. Tracking Performance

Sumber: `frontend/Tracking/script.js`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant TRACK as Halaman Tracking
    participant LS as LocalStorage
    participant API as AuthController
    participant DB as Repository dan MariaDB

    User->>TRACK: Membuka halaman Tracking
    TRACK->>LS: Ambil userId

    alt User belum login
        TRACK-->>User: Tampilkan error
    else User tersedia
        TRACK->>API: GET /api/GetUserCampaigns/{userId}
        API->>DB: Cari campaign milik user
        DB-->>API: Daftar campaignId
        API-->>TRACK: Daftar campaignId

        loop Untuk setiap campaign
            TRACK->>API: GET /api/PerformanceReport/{campaignId}
            API->>DB: Ambil campaign dan performance metrics
            DB-->>API: Campaign dan metrics
            API-->>TRACK: Report
            TRACK->>TRACK: Hitung revenue, ad spend, dan target ROAS

            TRACK->>API: GET /api/roas/{campaignId}
            API->>DB: Ambil performance metrics
            DB-->>API: Metrics
            API-->>TRACK: ROAS, CTR, CPC

            alt Metrics API gagal
                TRACK->>TRACK: Gunakan ROAS hasil hitung manual
            end
        end

        TRACK->>TRACK: Tentukan status terhadap target
        TRACK->>TRACK: Render KPI, tabel, chart ROAS, dan revenue
        TRACK-->>User: Tampilkan tracking performance
    end
```

## 10. Product Breakdown

Sumber: `frontend/Product/script.js`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant PRODUCT as Halaman Product
    participant LS as LocalStorage
    participant API as AuthController
    participant DB as Repository dan MariaDB

    User->>PRODUCT: Membuka Product Breakdown
    PRODUCT->>LS: Ambil userId
    PRODUCT->>API: GET /api/GetUserCampaigns/{userId}
    API->>DB: Cari campaign milik user
    DB-->>API: Daftar campaignId
    API-->>PRODUCT: Daftar campaignId

    loop Untuk setiap campaign
        PRODUCT->>API: GET /api/PerformanceReport/{campaignId}
        API->>DB: Ambil campaign dan performance metrics
        DB-->>API: Report data
        API-->>PRODUCT: Campaign + performance
        PRODUCT->>PRODUCT: Kelompokkan berdasarkan product dan channel
        PRODUCT->>PRODUCT: Akumulasi budget, spend, target, dan revenue
    end

    PRODUCT->>PRODUCT: Hitung ROAS dan target ROAS tiap kelompok
    PRODUCT->>PRODUCT: Terapkan search dan channel filter
    PRODUCT->>PRODUCT: Render KPI, cards, tabel, dan charts
    PRODUCT-->>User: Tampilkan product breakdown

    opt User mengubah search atau channel filter
        User->>PRODUCT: Input filter
        PRODUCT->>PRODUCT: Filter data lokal dan render ulang
        PRODUCT-->>User: Tampilkan hasil filter
    end
```

## 11. Comparison Campaign

Sumber: `frontend/Comparison/script.js`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant COMP as Halaman Comparison
    participant LS as LocalStorage
    participant API as AuthController
    participant DB as Repository dan MariaDB

    User->>COMP: Membuka halaman Comparison
    COMP->>LS: Ambil userId
    COMP->>API: GET /api/GetUserCampaigns/{userId}
    API->>DB: Cari campaign milik user
    DB-->>API: Daftar campaignId
    API-->>COMP: Daftar campaignId

    loop Untuk setiap campaign
        COMP->>API: GET /api/PerformanceReport/{campaignId}
        API->>DB: Ambil campaign dan performance metrics
        DB-->>API: Report data
        API-->>COMP: Campaign + performance
        COMP->>COMP: Jumlahkan actual revenue
        COMP->>COMP: Hitung selisih dan achievement terhadap target
    end

    COMP->>COMP: Terapkan search dan channel filter
    COMP->>COMP: Render KPI dan comparison cards
    COMP->>COMP: Render tabel, revenue chart, dan achievement chart
    COMP-->>User: Tampilkan perbandingan campaign

    opt User mengubah filter
        User->>COMP: Input search atau channel
        COMP->>COMP: Filter data lokal dan render ulang
        COMP-->>User: Tampilkan hasil terbaru
    end
```

## 12. Memuat dan Mengekspor Report

Sumber: `frontend/Export/script.js`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant EXPORT as Halaman Export
    participant LS as LocalStorage
    participant API as AuthController
    participant DB as Repository dan MariaDB
    participant BROWSER as Browser File API

    User->>EXPORT: Membuka halaman Export
    EXPORT->>LS: Ambil userId
    EXPORT->>API: GET /api/GetUserCampaigns/{userId}
    API->>DB: Cari campaign milik user
    DB-->>API: Daftar campaignId
    API-->>EXPORT: Daftar campaignId

    loop Untuk setiap campaign
        EXPORT->>API: GET /api/PerformanceReport/{campaignId}
        API->>DB: Ambil campaign dan performance metrics
        DB-->>API: Report data
        API-->>EXPORT: Campaign + performance
        EXPORT->>EXPORT: Hitung spend, revenue, impressions,<br/>clicks, conversions, ROAS, CTR, CPC

        EXPORT->>API: GET /api/roas/{campaignId}
        API->>DB: Ambil performance metrics
        DB-->>API: Metrics
        API-->>EXPORT: ROAS, CTR, CPC

        alt Metrics API gagal
            EXPORT->>EXPORT: Pertahankan hasil hitung manual
        end
    end

    EXPORT->>EXPORT: Render KPI dan tabel report
    EXPORT-->>User: Report siap difilter atau diekspor

    opt User menerapkan filter
        User->>EXPORT: Pilih filter report
        EXPORT->>EXPORT: Filter data lokal
        EXPORT-->>User: Render hasil filter
    end

    alt Export CSV atau Excel
        User->>EXPORT: Pilih CSV atau Excel
        EXPORT->>EXPORT: Susun header dan baris data
        EXPORT->>BROWSER: Buat Blob dan object URL
        BROWSER->>BROWSER: Buat link download sementara
        BROWSER-->>User: Unduh file .csv atau .xls
        EXPORT->>BROWSER: Cabut object URL
    else Export jenis lain
        User->>EXPORT: Pilih print
        EXPORT->>BROWSER: window.print()
        BROWSER-->>User: Dialog print atau simpan PDF
    end
```

## 13. Endpoint dan Pemakainya

| Endpoint | Method | Frontend yang memakai |
|---|---|---|
| `/api/register` | POST | Registrasi |
| `/api/login` | POST | Login |
| `/api/change-password` | PUT | Reset Password |
| `/api/campaign` | POST | Input Campaign |
| `/api/GetUserCampaigns/{userId}` | GET | Dashboard, Tracking, Product, Comparison, Export |
| `/api/PerformanceReport/{id}` | GET | Dashboard, Tracking, Product, Comparison, Export |
| `/api/roas/{id}` | GET | Dashboard, Tracking, Export |
| `/api/campaign/{campaignId}` | PUT | Dashboard |
| `/api/campaign/{campaignId}` | DELETE | Dashboard |
