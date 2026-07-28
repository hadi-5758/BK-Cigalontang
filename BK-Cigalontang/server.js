const express = require('express');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, AlignmentType, VerticalAlign, PageBreak, HeadingLevel } = require('docx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static('public'));

// Initialize Gemini API
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// 11 Tugas Perkembangan
const TUGAS_PERKEMBANGAN = {
  'tp1': 'Menerima Keadaan Fisik',
  'tp2': 'Menerima Peran Seks',
  'tp3': 'Mengembangkan Keterampilan Intelektual',
  'tp4': 'Bergaul dengan Teman Sebaya',
  'tp5': 'Kemandirian Emosional',
  'tp6': 'Persiapan Karir',
  'tp7': 'Persiapan Pernikahan & Keluarga',
  'tp8': 'Mengembangkan Nilai & Moral',
  'tp9': 'Tanggung Jawab Sosial',
  'tp10': 'Tanggung Jawab Warga Negara',
  'tp11': 'Kemandirian Pribadi'
};

// Function to generate material using Gemini
async function generateMaterial(taskName, issues, counselingApproach, additionalContext = {}) {
  if (!genAI) {
    return getDefaultMaterial(taskName);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const { targetGrade = 'X-XII', currentChallenges = '', recentIncidents = '' } = additionalContext;
    const currentYear = new Date().getFullYear();

    const systemPrompt = `Anda adalah seorang konselor berpengalaman di SMA Indonesia dengan 10+ tahun pengalaman.
Tugas Anda: buat materi bimbingan yang KONTEKSTUAL dengan siswa generasi Z (2026), berbasis penelitian terkini,
dan practical untuk diaplikasikan langsung di kelas.

PENTING:
- Perhatikan ISU NYATA yang dihadapi siswa saat ini (digital stress, self-worth, pressure akademik)
- Sertakan data/riset terkini yang relevan
- Beri contoh kasus konkrit yang relatable untuk siswa usia SMA
- Jangan hanya teori; fokus pada strategi action-oriented`;

    const prompt = `Buatkan materi MENDALAM untuk layanan bimbingan konseling dengan spesifikasi berikut:

## KONTEKS
- Tugas Perkembangan: ${taskName}
- Topik/Isu Spesifik: ${issues}
- Target Grade: ${targetGrade}
- Pendekatan: ${counselingApproach}
- Tantangan Kini: ${currentChallenges || '(tidak disebutkan)'}
- Insiden Terkait: ${recentIncidents || '(tidak ada)'}
- Tahun Pelajaran: ${currentYear}/${currentYear + 1}

## INSTRUKSI KONTEN

1. KONTEKSTUALISASI (Pahami situasi siswa Gen Z 2026)
2. DATA & RISET (Sertakan insight dari penelitian terkini tentang isu ini)
3. IDENTIFIKASI MASALAH (Apa yang benar-benar dihadapi siswa? Jangan generik)
4. STRATEGI BERBASIS BUKTI (Evidence-based approaches)
5. AKTIVITAS PRAKTIS (Kegiatan konkrit yang bisa langsung diaplikasikan)

## FORMAT WAJIB (Gunakan separator ===)

PENGERTIAN & KONTEKS SAAT INI
[3-4 paragraf: jelaskan konsep + situasi terkini siswa 2026 yang menghadapi issue ini]

===

GEJALA/TANDA YANG PERLU DIPERHATIKAN
[5-6 bullet: apa saja yang terlihat ketika siswa mengalami masalah ini?]

===

DAMPAK JANGKA PANJANG (Jika tidak ditangani)
[3-4 bullet: jelaskan konsekuensi psikologis, akademik, sosial]

===

FAKTOR-FAKTOR RISIKO & PROTEKTIF
Risiko: [3-4 bullet]
Protektif: [3-4 bullet]

===

STRATEGI PENGEMBANGAN (ACTION-ORIENTED)
[6-8 bullet: strategi konkrit yang bisa siswa lakukan sendiri + guru BK fasilitasi]

===

TEKNIK LAYANAN BK YANG EFEKTIF
[5-6 bullet: teknik konseling dengan penjelasan singkat cara implementasinya]

===

AKTIVITAS BIMBINGAN KELOMPOK (READY TO USE)
[Sertakan 2-3 aktivitas siap pakai dengan langkah-langkah konkrit, durasi, dan alat yang diperlukan]

===

INDIKATOR KEBERHASILAN
[4-5 bullet: apa yang bisa diobservasi sebagai tanda siswa berkembang positif]

Respons HARUS dalam Bahasa Indonesia, praktis, dan mudah diaplikasikan oleh guru BK untuk siswa SMA.`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: systemPrompt + '\n\n' + prompt
            }
          ]
        }
      ]
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return getDefaultMaterial(taskName);
  }
}

function getDefaultMaterial(taskName) {
  const materials = {
    'Menerima Keadaan Fisik': `PENGERTIAN
Menerima keadaan fisik berarti memahami, menghargai, dan puas dengan perubahan dan kondisi tubuh yang terjadi pada diri sendiri, terutama selama masa pubertas. Ini melibatkan pengembangan body image yang positif dan penerimaan terhadap keunikan fisik setiap individu.

===

KARAKTERISTIK/CIRI-CIRI
• Memahami perubahan fisik yang terjadi selama pubertas
• Menunjukkan sikap positif terhadap penampilan fisik sendiri
• Tidak terlalu khawatir dengan kritik terhadap penampilan
• Mampu merawat dan menjaga kesehatan tubuh
• Menunjukkan percaya diri dalam berinteraksi sosial

===

MANFAAT/PENTINGNYA
• Meningkatkan self-esteem dan percaya diri dalam aktivitas sehari-hari
• Mengurangi kecemasan dan stress terkait perubahan fisik
• Mendorong gaya hidup sehat dan kebersihan personal
• Membangun hubungan sosial yang lebih positif
• Mencegah gangguan makan dan body dysmorphia

===

STRATEGI PENGEMBANGAN
• Memberikan informasi akurat tentang perubahan pubertas
• Diskusi terbuka tentang body image dan standar kecantikan
• Mengapreasiasi keberagaman bentuk dan ukuran tubuh
• Mengajak fokus pada fungsi tubuh, bukan hanya penampilan
• Membimbing pola hidup sehat dan olahraga teratur

===

TEKNIK LAYANAN BK
• Konseling individual atau kelompok tentang body image
• Workshop tentang pubertas dan perubahan fisik
• Role play tentang respons terhadap komentar negatif
• Kegiatan eksplorasi kekuatan personal (strength finder)
• Psychoeducation tentang standar kecantikan yang realistis`,

    'Menerima Peran Seks': `PENGERTIAN
Menerima peran seks berarti memahami, menghargai, dan merasa nyaman dengan identitas gender dan peran sosial yang sesuai dengan jenis kelamin. Ini mencakup pemahaman tentang kesetaraan gender dan kemampuan untuk beradaptasi dengan peran gender yang sehat.

===

KARAKTERISTIK/CIRI-CIRI
• Memahami perbedaan antara sex (biologis) dan gender (sosial)
• Merasa nyaman dengan identitas gender mereka
• Menghargai kesetaraan antara laki-laki dan perempuan
• Tidak mengalami confusion atau distress tentang peran gender
• Mampu mengekspresikan aspirasi tanpa batasan gender

===

MANFAAT/PENTINGNYA
• Meningkatkan sense of identity dan belonging
• Mengurangi gender-based anxiety dan stress
• Mendorong aspirasi karir yang tidak terbatas gender
• Membangun hubungan interpersonal yang sehat
• Mencegah gender-based discrimination dan stereotyping

===

STRATEGI PENGEMBANGAN
• Edukasi tentang konsep sex dan gender
• Diskusi tentang peran gender dalam masyarakat modern
• Mengapresiasi kualitas positif dari semua gender
• Mendorong eksplorasi minat tanpa pembatasan gender
• Membangun kesadaran tentang bias gender dan stereotip

===

TEKNIK LAYANAN BK
• Layanan informasi tentang perspektif gender
• Diskusi kelompok tentang isu-isu gender
• Role play tentang situasi gender di kehidupan sehari-hari
• Eksplorasi nilai dan aspirasi personal
• Mentoring dari role model positif yang menentang stereotip`
  };

  return materials[taskName] || materials['Menerima Keadaan Fisik'];
}

function createComponentRow(letter, componentName, content) {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: letter, bold: true })],
        width: { size: 5, type: 'pct' },
        borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
        verticalAlign: VerticalAlign.TOP
      }),
      new TableCell({
        children: [new Paragraph({ text: componentName, bold: true })],
        width: { size: 25, type: 'pct' },
        borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
        verticalAlign: VerticalAlign.TOP
      }),
      new TableCell({
        children: Array.isArray(content) ? content : [new Paragraph(content)],
        width: { size: 70, type: 'pct' },
        borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
        verticalAlign: VerticalAlign.TOP
      })
    ]
  });
}

function parseMaterial(materialText) {
  const sections = materialText.split('===').map(s => s.trim());
  const paragraphs = [];

  sections.forEach((section, index) => {
    const lines = section.split('\n').filter(l => l.trim());

    lines.forEach((line, lineIndex) => {
      line = line.trim();
      if (line.startsWith('•') || line.startsWith('-')) {
        // Bullet point
        paragraphs.push(new Paragraph({
          text: line.replace(/^[•\-]\s*/, ''),
          spacing: { after: 50 }
        }));
      } else if (line.match(/^[A-Z][A-Za-z\s&\/()\-\:]*[A-Z]$/) || line.match(/^[A-Z]+(\s[A-Z]+)*\:?$/)) {
        // Header atau sub-header (uppercase dengan optional colon atau spaced words)
        paragraphs.push(new Paragraph({
          text: line,
          bold: true,
          spacing: { after: 100, before: 100 }
        }));
      } else if (line.endsWith(':') && line.length > 0) {
        // Sub-section label (e.g., "Risiko:", "Protektif:")
        paragraphs.push(new Paragraph({
          text: line,
          bold: true,
          spacing: { after: 50, before: 50 }
        }));
      } else if (line.length > 0) {
        // Regular paragraph
        paragraphs.push(new Paragraph({
          text: line,
          spacing: { after: 50 }
        }));
      }
    });

    if (index < sections.length - 1) {
      paragraphs.push(new Paragraph({ text: '' }));
    }
  });

  return paragraphs;
}

// Generate DOCX file
app.post('/api/generate-modul', async (req, res) => {
  try {
    const {
      counselorName,
      counselorNIP,
      schoolName,
      principalName,
      principalNIP,
      targetClass,
      developmentalTask,
      semester,
      duration,
      numSessions,
      councselingGoals,
      counselingApproach,
      issues,
      media,
      tools,
      implementationDate,
      targetGrade,
      currentChallenges,
      recentIncidents
    } = req.body;

    const taskName = TUGAS_PERKEMBANGAN[developmentalTask];
    const numSessionsInt = parseInt(numSessions) || 1;
    const durationPerSession = Math.ceil(parseInt(duration) / numSessionsInt);

    // Generate material using Gemini dengan konteks lengkap
    const materialText = await generateMaterial(taskName, issues, counselingApproach, {
      targetGrade: targetGrade || 'X-XII',
      currentChallenges: currentChallenges || '',
      recentIncidents: recentIncidents || ''
    });
    const materialParagraphs = parseMaterial(materialText);

    const children = [];

    // TITLE
    children.push(
      new Paragraph({
        text: 'RENCANA PELAKSANAAN LAYANAN (RPL)',
        alignment: AlignmentType.CENTER,
        bold: true,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: 'BIMBINGAN KELOMPOK',
        alignment: AlignmentType.CENTER,
        bold: true,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `SEMESTER ${semester.toUpperCase()} TAHUN PELAJARAN ${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // MAIN TABLE - Components A-K
    const mainTable = [
      createComponentRow('A', 'Komponen Layanan', 'Layanan Dasar'),
      createComponentRow('B', 'Bidang Layanan', 'Pribadi'),
      createComponentRow('C', 'Fungsi Layanan', 'Pemahaman, Pencegahan'),
      createComponentRow('D', 'Tujuan', [
        new Paragraph({
          text: 'Tujuan Umum:',
          bold: true,
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: `Mengembangkan potensi peserta didik terkait "${taskName}".`,
          spacing: { after: 150 }
        }),
        new Paragraph({
          text: 'Tujuan Khusus:',
          bold: true,
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: councselingGoals || 'Peserta didik dapat memahami dan mengembangkan aspek perkembangan yang menjadi fokus layanan ini.',
        })
      ]),
      createComponentRow('E', 'Topik', taskName),
      createComponentRow('F', 'Sasaran Layanan', targetClass),
      createComponentRow('G', 'Strategi/Metode/Teknik', [
        new Paragraph({
          text: `Strategi: Discovery`,
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: 'Metode: Diskusi Kelompok',
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: `Teknik: Eksplorasi, Problem Solving, Role Play, Refleksi (${counselingApproach})`,
        })
      ]),
      createComponentRow('H', 'Waktu', `${numSessions} × ${durationPerSession} menit`),
      createComponentRow('I', 'Media/Alat', [
        new Paragraph({
          text: `Media: ${media || '-'}`,
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: `Alat: ${tools || 'Buku tulis, pulpen, spidol'}`,
        })
      ]),
      createComponentRow('J', 'Tanggal Pelaksanaan', implementationDate || '_________________'),
      createComponentRow('K', 'Sumber Bacaan', [
        new Paragraph('1. Santrock, J. W. (2014). Adolescence (15th ed.)'),
        new Paragraph('2. Havighurst, R. J. (1972). Developmental Tasks and Education'),
        new Paragraph('3. Super, D. E. (1990). A Life-Span, Life-Space Approach to Career Development'),
        new Paragraph('4. Material AI-Generated (Gemini API)')
      ])
    ];

    children.push(
      new Table({
        width: { size: 100, type: 'pct' },
        rows: mainTable
      }),
      new Paragraph({ text: '' }),
      new Paragraph({ text: '' })
    );

    // L - URAIAN KEGIATAN
    children.push(
      new Table({
        width: { size: 100, type: 'pct' },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'L', bold: true })],
                width: { size: 5, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                verticalAlign: VerticalAlign.TOP
              }),
              new TableCell({
                children: [new Paragraph({ text: 'Uraian Kegiatan', bold: true })],
                width: { size: 95, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                columnSpan: 2,
                verticalAlign: VerticalAlign.TOP
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph('')],
                width: { size: 5, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'Tahap', bold: true })],
                width: { size: 25, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                shading: { fill: 'E7E6E6' }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'Uraian Kegiatan', bold: true })],
                width: { size: 70, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                shading: { fill: 'E7E6E6' }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph('')],
                width: { size: 5, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } }
              }),
              new TableCell({
                children: [new Paragraph({ text: '1. TAHAP AWAL', bold: true })],
                width: { size: 25, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                verticalAlign: VerticalAlign.TOP
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: 'a. Pernyataan Tujuan',
                    bold: true,
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '1) Pembukaan dengan salam, doa, dan cek kehadiran',
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '2) Ice breaking untuk membangun suasana santai',
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '3) Menyampaikan tujuan layanan',
                    spacing: { after: 150 }
                  }),
                  new Paragraph({
                    text: 'b. Penjelasan tentang Langkah-langkah Kegiatan',
                    bold: true,
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '1) Menjelaskan tujuan, aturan main, dan tugas peserta',
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '2) Membentuk dinamika kelompok yang positif',
                    spacing: { after: 150 }
                  }),
                  new Paragraph({
                    text: 'c. Tahap Peralihan (Transisi/Storming)',
                    bold: true,
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '1) Menanyakan kesiapan kelompok',
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '2) Memberi kesempatan bertanya',
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '3) Norming - Mengarahkan masuk ke tahap inti',
                  })
                ],
                width: { size: 70, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                verticalAlign: VerticalAlign.TOP
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph('')],
                width: { size: 5, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } }
              }),
              new TableCell({
                children: [new Paragraph({ text: '2. TAHAP INTI', bold: true })],
                width: { size: 25, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                verticalAlign: VerticalAlign.TOP
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: 'Proses/kegiatan yang dialami peserta didik dalam suatu kegiatan bimbingan berdasarkan teknik tertentu (Eksperientasi):',
                    spacing: { after: 100 }
                  }),
                  new Paragraph({
                    text: '1) EKSPLORASI',
                    bold: true,
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: `Diskusi terbuka tentang "${taskName}". Peserta berbagi pengalaman, pemikiran, dan perasaan terkait topik.`,
                    spacing: { after: 100 }
                  }),
                  new Paragraph({
                    text: '2) PROBLEM SOLVING',
                    bold: true,
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: 'Mengidentifikasi masalah dan bersama mencari solusi serta strategi mengatasinya.',
                    spacing: { after: 100 }
                  }),
                  new Paragraph({
                    text: '3) REFLEKSI & PENGUATAN',
                    bold: true,
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: 'Peserta merenungkan pembelajaran yang diperoleh dan membuat kesimpulan bersama.',
                  })
                ],
                width: { size: 70, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                verticalAlign: VerticalAlign.TOP
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph('')],
                width: { size: 5, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } }
              }),
              new TableCell({
                children: [new Paragraph({ text: '3. TAHAP PENUTUP', bold: true })],
                width: { size: 25, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                verticalAlign: VerticalAlign.TOP
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: 'a. Pengungkapan Perasaan, Pemikiran & Pengalaman tentang apa yang terjadi dalam kegiatan bimbingan (Refleksi):',
                    spacing: { after: 100 }
                  }),
                  new Paragraph({
                    text: '1) Apa yang Anda rasakan dalam layanan ini?',
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '2) Apa hal baru yang Anda peroleh?',
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '3) Bagaimana komitmen tindakan Anda ke depan?',
                    spacing: { after: 150 }
                  }),
                  new Paragraph({
                    text: 'b. Tindak Lanjut:',
                    bold: true,
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '1) Memberikan penguatan positif terhadap pencapaian kelompok',
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '2) Merencanakan follow-up dan tindakan nyata',
                    spacing: { after: 150 }
                  }),
                  new Paragraph({
                    text: 'c. Penutupan:',
                    bold: true,
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: '1) Doa penutup dan salam penutup',
                  })
                ],
                width: { size: 70, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                verticalAlign: VerticalAlign.TOP
              })
            ]
          })
        ]
      }),
      new Paragraph({ text: '' }),
      new Paragraph({ text: '' })
    );

    // M - EVALUASI
    children.push(
      new Table({
        width: { size: 100, type: 'pct' },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'M', bold: true })],
                width: { size: 5, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                verticalAlign: VerticalAlign.TOP
              }),
              new TableCell({
                children: [new Paragraph({ text: 'Evaluasi', bold: true })],
                width: { size: 95, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                columnSpan: 2,
                verticalAlign: VerticalAlign.TOP
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph('')],
                width: { size: 5, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } }
              }),
              new TableCell({
                children: [new Paragraph({ text: '1. Evaluasi Proses', bold: true })],
                width: { size: 25, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                verticalAlign: VerticalAlign.TOP
              }),
              new TableCell({
                children: [
                  new Paragraph('• Keterlibatan peserta dalam kegiatan bimbingan kelompok'),
                  new Paragraph('• Dinamika kelompok yang terbangun'),
                  new Paragraph('• Kualitas diskusi dan interaksi antar anggota'),
                  new Paragraph('• Suasana layanan (nyaman, interaktif, terbuka)')
                ],
                width: { size: 70, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                verticalAlign: VerticalAlign.TOP
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph('')],
                width: { size: 5, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } }
              }),
              new TableCell({
                children: [new Paragraph({ text: '2. Evaluasi Hasil', bold: true })],
                width: { size: 25, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                verticalAlign: VerticalAlign.TOP
              }),
              new TableCell({
                children: [
                  new Paragraph('• Pemahaman peserta terhadap topik yang dibahas'),
                  new Paragraph('• Perubahan perspektif/sikap peserta'),
                  new Paragraph('• Komitmen tindak lanjut peserta'),
                  new Paragraph('• Capaian indikator keberhasilan layanan')
                ],
                width: { size: 70, type: 'pct' },
                borders: { all: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                verticalAlign: VerticalAlign.TOP
              })
            ]
          })
        ]
      }),
      new Paragraph({ text: '' }),
      new Paragraph({ text: '' }),
      new Paragraph({ text: '' })
    );

    // ADD MATERIAL SECTION (NEW PAGE)
    children.push(
      new PageBreak(),
      new Paragraph({
        text: 'MATERI LAYANAN',
        heading: HeadingLevel.HEADING_1,
        bold: true,
        spacing: { before: 0, after: 200 }
      }),
      new Paragraph({
        text: `Topik: ${taskName}`,
        bold: true,
        spacing: { after: 200 }
      }),
      ...materialParagraphs
    );

    // Tanda tangan
    children.push(
      new PageBreak(),
      new Table({
        width: { size: 100, type: 'pct' },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    text: `${schoolName}`,
                    spacing: { after: 200 }
                  }),
                  new Paragraph({
                    text: 'Kepala Sekolah,',
                    spacing: { after: 250 }
                  }),
                  new Paragraph({
                    text: ' ',
                    spacing: { after: 100 }
                  }),
                  new Paragraph({
                    text: ' ',
                    spacing: { after: 100 }
                  }),
                  new Paragraph({
                    text: principalName,
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: `NIP. ${principalNIP}`,
                  })
                ],
                width: { size: 50, type: 'pct' },
                borders: { all: { style: BorderStyle.NONE } }
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: ' ',
                    spacing: { after: 200 }
                  }),
                  new Paragraph({
                    text: 'Konselor/Guru BK,',
                    spacing: { after: 250 }
                  }),
                  new Paragraph({
                    text: ' ',
                    spacing: { after: 100 }
                  }),
                  new Paragraph({
                    text: ' ',
                    spacing: { after: 100 }
                  }),
                  new Paragraph({
                    text: counselorName,
                    spacing: { after: 50 }
                  }),
                  new Paragraph({
                    text: `NIP. ${counselorNIP}`,
                  })
                ],
                width: { size: 50, type: 'pct' },
                borders: { all: { style: BorderStyle.NONE } }
              })
            ]
          })
        ]
      })
    );

    // Create document
    const doc = new Document({
      sections: [
        {
          children: children
        }
      ]
    });

    // Generate and send file
    Packer.toBuffer(doc).then(buffer => {
      const taskCode = developmentalTask.replace(/tp/, 'TP');
      const filename = `RPL_BK_${taskCode}_${Date.now()}.docx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    }).catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Gagal membuat dokumen' });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  if (process.env.GEMINI_API_KEY) {
    console.log('✓ Gemini API enabled - Material generation available');
  } else {
    console.log('⚠ Gemini API not configured - Using default materials');
    console.log('  Set GEMINI_API_KEY in .env file to enable AI material generation');
  }
});
