"""Cut static Anek instances from the variable fonts, subset them, and set names so
the Android file name equals the iOS PostScript name (SPEC §24)."""
import sys, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

src_dir, out_dir = sys.argv[1], sys.argv[2]
os.makedirs(out_dir, exist_ok=True)
# (style suffix, weight, width)
STYLES = [
    ('Regular', 400, 100), ('Medium', 500, 100), ('SemiBold', 600, 100),
    ('SemiExpandedBold', 700, 112.5), ('SemiExpandedExtraBold', 800, 112.5),
    ('ExpandedExtraBold', 800, 125),
]
COMMON = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + list(range(0x2010, 0x2028)) + [
    0x2212, 0x2191, 0x2026, 0x00D7, 0x00F7, 0x2032, 0x2033, 0x2070, 0x00B9, 0x00B2, 0x00B3, 0x207F]
FAMILIES = {
    'AnekBangla': COMMON + list(range(0x0980, 0x0A00)) + [0x200C, 0x200D, 0x25CC, 0x0964, 0x0965],
    'AnekLatin': COMMON,
}
for fam, unicodes in FAMILIES.items():
    for suffix, wght, wdth in STYLES:
        vf = TTFont(os.path.join(src_dir, fam + '.ttf'))
        f = instancer.instantiateVariableFont(vf, {'wght': wght, 'wdth': wdth})
        opts = subset.Options()
        opts.layout_features = ['*']
        opts.name_IDs = ['*']
        opts.hinting = False
        opts.notdef_outline = True
        s = subset.Subsetter(opts)
        s.populate(unicodes=unicodes)
        s.subset(f)
        ps = f'{fam}-{suffix}'
        name = f['name']
        for rec in list(name.names):
            if rec.nameID in (1, 2, 3, 4, 6, 16, 17, 25):
                name.removeNames(nameID=rec.nameID)
        for nid, val in ((1, ps), (2, 'Regular'), (3, ps), (4, ps), (6, ps)):
            name.setName(val, nid, 3, 1, 0x409)
            name.setName(val, nid, 1, 0, 0)
        f['OS/2'].usWeightClass = wght
        f['OS/2'].fsSelection = (f['OS/2'].fsSelection & ~0b1100001) | 0b1000000  # REGULAR bit only
        f['head'].macStyle = 0
        path = os.path.join(out_dir, ps + '.ttf')
        f.save(path)
        print(ps, os.path.getsize(path))
