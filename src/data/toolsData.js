export const PDF_TOOLS = [
  // Row 1
  {
    id: 'merge',
    title: 'Merge PDF',
    description: 'Combine PDFs in the order you want with the easiest PDF merger available.',
    category: 'organize',
    icon: 'Layers',
    badge: 'Popular',
    iconColor: 'text-red-500 bg-red-50',
    accept: '.pdf',
    multiple: true,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'split',
    title: 'Split PDF',
    description: 'Separate one page or a whole set for easy conversion into independent PDF files.',
    category: 'organize',
    icon: 'Split',
    badge: 'Essential',
    iconColor: 'text-red-500 bg-red-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'compress',
    title: 'Compress PDF',
    description: 'Reduce file size while optimizing for maximal PDF quality.',
    category: 'optimize',
    icon: 'Minimize2',
    badge: 'Popular',
    iconColor: 'text-emerald-600 bg-emerald-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    description: 'Easily convert your PDF files into easy to edit DOC and DOCX documents.',
    category: 'convert-from',
    icon: 'FileType',
    officeType: 'word',
    badge: 'Pro',
    iconColor: 'text-blue-600 bg-blue-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'pdf-to-powerpoint',
    title: 'PDF to PowerPoint',
    description: 'Turn your PDF files into real, editable PPTX PowerPoint presentations.',
    category: 'convert-from',
    icon: 'Presentation',
    officeType: 'ppt',
    badge: 'PPTX',
    iconColor: 'text-orange-600 bg-orange-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'pdf-to-excel',
    title: 'PDF to Excel',
    description: 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.',
    category: 'convert-from',
    icon: 'Sheet',
    officeType: 'excel',
    badge: 'Smart',
    iconColor: 'text-emerald-700 bg-emerald-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },

  // Row 2
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Make DOC and DOCX files easy to read by converting them to clean PDF documents.',
    category: 'convert-to',
    icon: 'FileText',
    officeType: 'word',
    badge: 'Popular',
    iconColor: 'text-blue-600 bg-blue-50',
    accept: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'powerpoint-to-pdf',
    title: 'PowerPoint to PDF',
    description: 'Convert real PPTX slideshows and presentation slides into high-res 16:9 PDF format.',
    category: 'convert-to',
    icon: 'Presentation',
    officeType: 'ppt',
    badge: 'Slides',
    iconColor: 'text-orange-600 bg-orange-50',
    accept: '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'excel-to-pdf',
    title: 'Excel to PDF',
    description: 'Make EXCEL spreadsheets easy to read by converting them to formatted PDF.',
    category: 'convert-to',
    icon: 'Sheet',
    officeType: 'excel',
    badge: 'Data',
    iconColor: 'text-emerald-700 bg-emerald-50',
    accept: '.xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'edit',
    title: 'Edit PDF',
    description: 'Add text, images, shapes or freehand annotations. Edit size, font, and color of added content.',
    category: 'edit',
    icon: 'PenTool',
    badge: 'Interactive',
    iconColor: 'text-purple-600 bg-purple-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'pdf-to-images',
    title: 'PDF to JPG',
    description: 'Convert each PDF page into a high-res JPG or extract all images contained in a PDF.',
    category: 'convert-from',
    icon: 'FileImage',
    badge: 'High-Res',
    iconColor: 'text-amber-500 bg-amber-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'images-to-pdf',
    title: 'JPG to PDF',
    description: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.',
    category: 'convert-to',
    icon: 'Image',
    badge: 'Instant',
    iconColor: 'text-amber-500 bg-amber-50',
    accept: 'image/png,image/jpeg,image/webp,image/jpg',
    multiple: true,
    fileSizeLimit: 'Unlimited'
  },

  // Row 3
  {
    id: 'crop',
    title: 'Crop PDF',
    description: 'Crop margins with live visual preview. Choose page-by-page custom crop or uniform style.',
    category: 'organize',
    icon: 'Crop',
    badge: 'Visual Preview',
    iconColor: 'text-pink-600 bg-pink-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'sign',
    title: 'Sign PDF',
    description: 'Sign yourself or request electronic signatures from others. Stamp digital signature.',
    category: 'edit',
    icon: 'CheckSquare',
    badge: 'Digital',
    iconColor: 'text-sky-600 bg-sky-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'watermark',
    title: 'Watermark',
    description: 'Stamp an image or text over your PDF in seconds. Choose typography, transparency and position.',
    category: 'edit',
    icon: 'Stamp',
    badge: 'Stamp',
    iconColor: 'text-fuchsia-600 bg-fuchsia-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'rotate',
    title: 'Rotate PDF',
    description: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!',
    category: 'organize',
    icon: 'RotateCw',
    badge: 'Instant',
    iconColor: 'text-indigo-600 bg-indigo-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'html-to-pdf',
    title: 'HTML to PDF',
    description: 'Convert webpages in HTML to PDF. Copy and paste the HTML or URL to render PDF.',
    category: 'convert-to',
    icon: 'Code2',
    badge: 'Web',
    iconColor: 'text-amber-600 bg-amber-50',
    accept: '.html,.htm,text/html',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },

  // Row 4
  {
    id: 'protect',
    title: 'Protect PDF',
    description: 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.',
    category: 'optimize',
    icon: 'ShieldCheck',
    badge: 'Encrypted',
    iconColor: 'text-sky-600 bg-sky-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'organize',
    title: 'Organize PDF',
    description: 'Sort pages of your PDF file however you like. Delete PDF pages or rotate pages at your convenience.',
    category: 'organize',
    icon: 'LayoutGrid',
    badge: 'Visual',
    iconColor: 'text-orange-500 bg-orange-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'pdf-to-pdfa',
    title: 'PDF to PDF/A',
    description: 'Transform your PDF to PDF/A, the ISO-standardized version of PDF for long-term archiving.',
    category: 'optimize',
    icon: 'FileCheck',
    badge: 'Archive',
    iconColor: 'text-blue-500 bg-blue-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'repair',
    title: 'Repair PDF',
    description: 'Repair a damaged PDF and recover data from corrupt PDF. Fix PDF files with our Repair tool.',
    category: 'optimize',
    icon: 'Wrench',
    badge: 'Recovery',
    iconColor: 'text-lime-600 bg-lime-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'page-numbers',
    title: 'Page numbers',
    description: 'Add page numbers into PDFs with ease. Choose your positions, dimensions, typography.',
    category: 'edit',
    icon: 'Hash',
    badge: 'Format',
    iconColor: 'text-violet-600 bg-violet-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'ocr',
    title: 'OCR PDF',
    description: 'Easily convert scanned PDF into searchable and selectable text documents in browser.',
    category: 'edit',
    icon: 'Search',
    badge: 'Searchable',
    iconColor: 'text-teal-600 bg-teal-50',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },

  // Row 5
  {
    id: 'redact',
    title: 'Redact PDF',
    description: 'Redact text and graphics to permanently remove sensitive or confidential information from a PDF.',
    category: 'optimize',
    icon: 'EyeOff',
    badge: 'Privacy',
    iconColor: 'text-slate-800 bg-slate-100',
    accept: '.pdf',
    multiple: false,
    fileSizeLimit: 'Unlimited'
  },
  {
    id: 'compare',
    title: 'Compare PDF',
    description: 'Show a side-by-side document comparison and easily spot visual changes between versions.',
    category: 'edit',
    icon: 'Columns2',
    badge: 'Diff',
    iconColor: 'text-blue-700 bg-blue-50',
    accept: '.pdf',
    multiple: true,
    fileSizeLimit: 'Unlimited'
  }
];

export const CATEGORIES = [
  { id: 'all', label: 'All Tools' },
  { id: 'organize', label: 'Organize PDF' },
  { id: 'convert-to', label: 'Convert to PDF' },
  { id: 'convert-from', label: 'Convert from PDF' },
  { id: 'edit', label: 'Edit & Sign' },
  { id: 'optimize', label: 'Security & Optimize' }
];
