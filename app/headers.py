order = {
    # MANADTORY COLUMNS WILL ALWAYS BE FIRST
    'MANDATORY': [
        "QC Status", "Sample", "QC Record Id", "Recipe"
    ],
    'hs': [
        "Mean Tgt Cvg", "Coverage Target", "Sum MTC",
        "Sum Reads", "Requested Reads (Millions)", "Reads Examined", "Unpaired Reads", "Unmapped",
        "Tumor or Normal",
        "Pct. Duplic.", "Pct. Off Bait", "Pct. Adapters", "Pct. Zero Cvg", "Pct. 10x", "Pct. 30x", "Pct. 100x"
    ],
    'rna': [
        "Concentr.  (nM)", "Final Library Yield (fmol)",
        "Sum Reads", "Reads Examined", "Unpaired Reads", "Requested Reads (Millions)","Unmapped",
        "Tumor or Normal",
        "Pct. Adapters", "Pct. Duplic.", "Pct. Ribos.", "Pct. Coding", "Pct. Utr", "Pct. Intron.", "Pct. Intergenic", "Pct. Mrna"
    ],
    'wgs':[
        "Mean Tgt Cvg", "Sum MTC", "Coverage Target",
        "Concentr.  (nM)", "Final Library Yield (fmol)",
        "Requested Reads (Millions)","Reads Examined", "Unpaired Reads", "Sum Reads","Unmapped",
        "Tumor or Normal",
        "Pct. Duplic.", "Pct. Adapters", "PCT_EXC_MAPQ", "PCT_EXC_DUPE", "PCT_EXC_BASEQ", "PCT_EXC_TOTAL", "PCT_10X", "PCT_30X", "PCT_40X", "PCT_80X", "PCT_100X"
    ],
    'md': [
        "Coverage Target",
        "Concentr.  (nM)", "Final Library Yield (fmol)",
        "Requested Reads (Millions)", "Reads Examined", "Unpaired Reads", "Sum Reads", "Unmapped",
        "Tumor or Normal",
        "Pct. Adapters", "Pct. Duplic."
    ],
    'default': [
        "QC Status", "Sample",
        "Coverage Target",
        "Concentr.  (nM)", "Final Library Yield (fmol)",
        "Requested Reads (Millions)", "Reads Examined", "Unpaired Reads", "Sum Reads", "Unmapped",
        "Tumor or Normal",
        "Pct. Adapters", "Pct. Duplic."
    ]
}
