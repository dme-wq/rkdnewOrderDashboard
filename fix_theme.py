import re

with open("components/ProductionTable.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Smart filter pill -> clean button
content = content.replace(
    '''        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all border shadow-sm ${
          isActive || open 
            ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-primary/50 shadow-primary/20" 
            : "bg-card/80 backdrop-blur-sm text-muted-foreground border-border hover:border-primary/30 hover:bg-muted/50 hover:text-foreground"
        }`}''',
    '''        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all border ${
          isActive || open 
            ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm" 
            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}'''
)

content = content.replace(
    '''          rounded-xl border border-border bg-card shadow-xl shadow-black/5 py-1.5 animate-in fade-in slide-in-from-top-1''',
    '''          rounded-xl border border-gray-200 bg-white shadow-lg py-1.5 animate-in fade-in slide-in-from-top-1'''
)

# Wrappers
content = content.replace(
    '''    <div className="relative rounded-2xl bg-gradient-to-br from-primary/30 via-border/50 to-primary/10 p-[1px] shadow-lg shadow-black/5 mb-6">
      <div className="rounded-[15px] bg-card overflow-hidden flex flex-col w-full">''',
    '''    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col w-full overflow-hidden mb-6">'''
)
content = content.replace(
    '''      </div>
    </div>
  );
}''',
    '''    </div>
  );
}'''
)

# Toolbar
content = content.replace(
    '''<div className="p-4 border-b border-border bg-card/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-20 relative">''',
    '''<div className="p-4 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-20 relative bg-white">'''
)

content = content.replace(
    '''              className="w-full pl-9 pr-4 py-2.5 text-[13.5px] rounded-xl border border-border bg-muted/30 text-foreground
                placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"''',
    '''              className="w-full pl-9 pr-4 py-2.5 text-[13px] rounded-lg border border-gray-200 bg-white text-gray-900
                placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"'''
)

# Date Presets
content = content.replace(
    '''          <div className="flex items-center p-1 bg-muted/40 rounded-xl border border-border gap-1 overflow-x-auto max-w-[280px] sm:max-w-full hide-scrollbar">''',
    '''          <div className="flex items-center p-1 bg-gray-100/80 rounded-lg border border-gray-200/60 gap-1 overflow-x-auto max-w-[280px] sm:max-w-full hide-scrollbar">'''
)
content = content.replace(
    '''                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all outline-none whitespace-nowrap flex-shrink-0 ${
                  activePreset === p.value
                    ? "bg-card text-foreground shadow-sm shadow-black/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}''',
    '''                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all outline-none whitespace-nowrap flex-shrink-0 ${
                  activePreset === p.value
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                }`}'''
)

# Export CSV Button
content = content.replace(
    '''            className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground hover:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"''',
    '''            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"'''
)

# Filters Row
content = content.replace(
    '''      <div className="px-5 py-3.5 bg-muted/20 border-b border-border flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground mr-2 bg-card px-3 py-1.5 rounded-full border border-border shadow-sm">
          <Filter size={14} className="text-primary" /> Filters
        </div>''',
    '''      <div className="px-5 py-3 bg-white border-b border-gray-100 flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-600 mr-2 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
          <Filter size={14} className="text-gray-500" /> Filters
        </div>'''
)

# Custom date picker
content = content.replace(
    '''        <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">''',
    '''        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">'''
)
content = content.replace(
    '''            className="px-3 py-1.5 rounded-lg text-[13px] border border-border bg-card shadow-sm text-foreground focus:outline-none focus:border-primary/50"''',
    '''            className="px-3 py-1.5 rounded-md text-[13px] border border-gray-200 bg-white shadow-sm text-gray-900 focus:outline-none focus:border-blue-400"'''
)

# Thead
content = content.replace(
    '''<thead className="bg-card/90 sticky top-0 z-10 backdrop-blur-xl border-b border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">''',
    '''<thead className="bg-white sticky top-0 z-10 border-b border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">'''
)

# Replace all th classes
content = re.sub(
    r'<th className="([^"]+?)border-b border-border/50([^"]*?)">',
    r'<th className="\1\2">',
    content
)
content = content.replace(
    '''text-[11px] font-bold text-muted-foreground uppercase tracking-wider''',
    '''text-[11px] font-semibold text-gray-400 uppercase tracking-wider'''
)
content = content.replace(
    '''text-muted-foreground/30 group-hover:text-muted-foreground/70''',
    '''text-gray-300 group-hover:text-gray-500'''
)

# Rows
content = content.replace(
    '''<tbody className="divide-y divide-border/40">''',
    '''<tbody className="bg-white">'''
)

content = content.replace(
    '''                  className="group transition-colors hover:bg-muted/40"''',
    '''                  className="group transition-colors hover:bg-gray-50/80 border-b border-gray-100 last:border-0"'''
)

# TD cells padding and colors
content = content.replace(
    '''<td className="px-5 py-3.5 text-[13px] text-muted-foreground tabular-nums border-b border-transparent group-hover:border-border/30">''',
    '''<td className="px-5 py-4 text-[13px] text-gray-500 tabular-nums">'''
)
content = content.replace('''py-3.5''', '''py-4''')
content = content.replace('''text-[13px] font-medium text-foreground''', '''text-[13px] font-medium text-gray-800''')
content = content.replace('''text-[13.5px] font-medium text-foreground''', '''text-[13.5px] font-medium text-gray-900''')

# PO Number
content = content.replace(
    '''<span className="font-mono text-[12.5px] font-medium bg-muted/80 border border-border/50 px-2 py-1 rounded-md text-foreground shadow-sm shadow-black/5">''',
    '''<span className="text-[13px] font-medium text-gray-900">'''
)

# Size
content = content.replace(
    '''<span className="text-[12px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full border border-border/50">''',
    '''<span className="text-[12px] font-medium text-gray-600 bg-gray-100/80 px-2.5 py-1 rounded-md">'''
)

# Karigar Name
content = content.replace(
    '''<div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold uppercase">''',
    '''<div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[11px] font-bold uppercase shrink-0">'''
)
content = content.replace('''text-[13.5px] font-medium text-foreground leading-tight''', '''text-[13.5px] font-semibold text-gray-900 leading-tight''')
content = content.replace('''text-[11px] text-muted-foreground''', '''text-[11px] text-gray-500''')

# Daily Delta Badge
content = content.replace(
    '''<div className={`inline-flex items-center gap-1 text-[13.5px] font-bold tabular-nums px-2 py-0.5 rounded-md ${row.dailyPiecesMade > 0 ? "bg-emerald-500/10 text-emerald-500" : "text-muted-foreground"}`}>''',
    '''<div className={`inline-flex items-center gap-1 text-[12px] font-bold tabular-nums px-2.5 py-1 rounded-full border ${row.dailyPiecesMade > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-500 border-gray-100"}`}>'''
)

# Pagination
content = content.replace(
    '''        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-border bg-card/60 gap-4">''',
    '''        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-gray-200 bg-white gap-4">'''
)
content = content.replace(
    '''<span className="text-[13px] text-muted-foreground">''',
    '''<span className="text-[13px] text-gray-500">'''
)
content = content.replace(
    '''<span className="font-semibold text-foreground">''',
    '''<span className="font-semibold text-gray-900">'''
)

content = content.replace(
    '''<select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="text-[12px] font-medium border border-border bg-muted/40 text-foreground rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-muted"
            >''',
    '''<select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="text-[12px] font-medium border border-gray-200 bg-white text-gray-700 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:bg-gray-50"
            >'''
)

content = content.replace(
    '''<div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl border border-border">''',
    '''<div className="flex items-center gap-1.5 bg-white">'''
)

content = content.replace(
    '''className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card hover:shadow-sm disabled:opacity-30 transition-all"''',
    '''className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"'''
)

content = content.replace(
    '''className={`w-8 h-8 rounded-lg text-[13px] font-semibold transition-all ${
                    p === page
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-card hover:shadow-sm"
                  }`}''',
    '''className={`w-8 h-8 rounded-md text-[13px] font-semibold transition-all border ${
                    p === page
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-transparent hover:border-gray-200 hover:bg-gray-50"
                  }`}'''
)


with open("components/ProductionTable.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated successfully")
