# Sequence Diagram ROAS Calculator

Sumber implementasi:
`tubes/frontend/Input/script.js` pada fungsi `calculateROAS()`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FORM as Form Input Campaign
    participant CALC as ROAS Calculator
    participant UI as Tampilan Hasil

    User->>FORM: Memasukkan anggaran
    activate FORM
    User->>FORM: Memasukkan target revenue
    FORM->>CALC: calculateROAS(anggaran, targetRevenue)
    activate CALC
    CALC->>CALC: Mengubah input menjadi angka

    alt Anggaran atau target revenue tidak valid
        CALC-->>UI: Reset formula, nilai, dan status
        activate UI
        UI-->>User: Menampilkan nilai ROAS kosong
        deactivate UI
    else Anggaran dan target revenue valid
        CALC->>CALC: ROAS = targetRevenue / anggaran
        CALC->>CALC: Membulatkan ROAS menjadi 2 desimal

        alt ROAS >= 5
            CALC-->>UI: Nilai ROAS dan status Sangat bagus
        else ROAS >= 2
            CALC-->>UI: Nilai ROAS dan status Normal
        else ROAS < 2
            CALC-->>UI: Nilai ROAS dan status Kurang optimal
        end

        activate UI
        UI->>UI: Memperbarui formula, nilai, warna, dan status
        UI-->>User: Menampilkan hasil ROAS
        deactivate UI
    end

    deactivate CALC
    deactivate FORM
```

## Rumus dan Status

```text
ROAS = Target Revenue / Anggaran
```

| Kondisi | Status |
|---|---|
| ROAS >= 5 | Sangat bagus |
| ROAS >= 2 dan < 5 | Normal |
| ROAS < 2 | Kurang optimal |
| Anggaran atau target revenue <= 0 | Hasil dikosongkan |

Perhitungan dilakukan secara lokal di browser. ROAS Calculator tidak
mengirim request ke `AuthController` atau database.
