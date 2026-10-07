<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto">
      <path d="M1 1 L9 5 L1 9" fill="none" stroke="#9AA0A6" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

  <rect width="1600" height="900" fill="@bg@"/><g transform="translate(0,-25)">

  <!-- LEFT: your design system -->
  <rect x="110" y="200" width="400" height="470" rx="24" fill="#FFFFFF" stroke="@border@" stroke-width="1.5"/>
  <text x="150" y="262" font-size="26" font-weight="600" fill="#1F2328">Your design system</text>

  <rect x="150" y="300" width="320" height="96" rx="16" fill="@bg@"/>
  <rect x="176" y="326" width="34" height="34" rx="6" fill="none" stroke="#1F2328" stroke-width="2"/>
  <rect x="190" y="340" width="34" height="34" rx="6" fill="#FFFFFF" stroke="@brand@" stroke-width="2"/>
  <text x="250" y="356" font-size="22" fill="#1F2328">Design files</text>

  <rect x="150" y="412" width="320" height="96" rx="16" fill="@bg@"/>
  <text x="170" y="469" font-size="24" font-weight="600" fill="@brand@" class="mono">&lt;/&gt;</text>
  <text x="250" y="468" font-size="22" fill="#1F2328">Code</text>

  <rect x="150" y="524" width="320" height="96" rx="16" fill="@bg@"/>
  <rect x="178" y="552" width="18" height="18" rx="5" fill="@brand@"/>
  <rect x="202" y="552" width="18" height="18" rx="5" fill="#1A7F37"/>
  <rect x="178" y="576" width="18" height="18" rx="5" fill="#D4A72C"/>
  <rect x="202" y="576" width="18" height="18" rx="5" fill="#CF222E"/>
  <text x="250" y="580" font-size="22" fill="#1F2328">Tokens</text>

  <!-- arrow 1 -->
  <line x1="530" y1="435" x2="668" y2="435" stroke="#9AA0A6" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round" marker-end="url(#arrow)"/>

  <!-- MIDDLE: the thin written layer -->
  <rect x="690" y="185" width="220" height="500" rx="16" fill="@brand-tint@" stroke="@brand@" stroke-width="1.5"/>
  <g class="mono" font-size="16" fill="@brand-text@">
    <text x="716" y="236" class="mono">purpose</text>
    <text x="716" y="318" class="mono">never use for</text>
    <text x="716" y="400" class="mono">rationale</text>
    <text x="716" y="482" class="mono">tokens</text>
    <text x="716" y="564" class="mono">decisions</text>
  </g>
  <g fill="@brand-soft@">
    <rect x="716" y="252" width="164" height="8" rx="4"/><rect x="716" y="266" width="112" height="8" rx="4"/>
    <rect x="716" y="334" width="150" height="8" rx="4"/><rect x="716" y="348" width="128" height="8" rx="4"/>
    <rect x="716" y="416" width="168" height="8" rx="4"/><rect x="716" y="430" width="96" height="8" rx="4"/>
    <rect x="716" y="498" width="140" height="8" rx="4"/><rect x="716" y="512" width="160" height="8" rx="4"/>
    <rect x="716" y="580" width="156" height="8" rx="4"/><rect x="716" y="594" width="120" height="8" rx="4"/>
  </g>
  <rect x="716" y="630" width="70" height="8" rx="4" fill="@brand-soft@"/>

  <!-- arrow 2 -->
  <line x1="930" y1="435" x2="1068" y2="435" stroke="#9AA0A6" stroke-width="2.5" stroke-dasharray="2 8" stroke-linecap="round" marker-end="url(#arrow)"/>

  <!-- RIGHT: AI agent generating UI -->
  <rect x="1090" y="200" width="400" height="470" rx="24" fill="#FFFFFF" stroke="@border@" stroke-width="1.5"/>
  <path d="M1146 240 C1148 252 1152 256 1164 258 C1152 260 1148 264 1146 276 C1144 264 1140 260 1128 258 C1140 256 1144 252 1146 240 Z" fill="@brand@"/>
  <text x="1178" y="267" font-size="26" font-weight="600" fill="#1F2328">AI agent</text>

  <rect x="1130" y="300" width="320" height="330" rx="16" fill="@bg@"/>
  <!-- heading + badge -->
  <rect x="1155" y="328" width="150" height="14" rx="7" fill="#1F2328" opacity="0.85"/>
  <rect x="1340" y="322" width="84" height="26" rx="13" fill="#E7F6EC"/>
  <text x="1382" y="340" font-size="14" font-weight="600" fill="#1A7F37" text-anchor="middle">Active</text>
  <rect x="1155" y="356" width="220" height="10" rx="5" fill="#C9CCD1"/>
  <!-- input -->
  <rect x="1155" y="392" width="80" height="10" rx="5" fill="#8B9097"/>
  <rect x="1155" y="410" width="270" height="44" rx="10" fill="#FFFFFF" stroke="#D0D3D8" stroke-width="1.5"/>
  <rect x="1172" y="428" width="120" height="9" rx="4.5" fill="#D0D3D8"/>
  <!-- switch row -->
  <rect x="1155" y="478" width="44" height="24" rx="12" fill="@brand@"/>
  <circle cx="1187" cy="490" r="9" fill="#FFFFFF"/>
  <rect x="1212" y="485" width="140" height="10" rx="5" fill="#8B9097"/>
  <!-- buttons -->
  <rect x="1155" y="540" width="130" height="44" rx="10" fill="@brand@"/>
  <text x="1220" y="568" font-size="17" font-weight="600" fill="#FFFFFF" text-anchor="middle">Save</text>
  <rect x="1295" y="540" width="130" height="44" rx="10" fill="none" stroke="@brand@" stroke-width="1.8" stroke-dasharray="6 5"/>
  <rect x="1312" y="552" width="2.5" height="20" rx="1" fill="@brand@"/>

  <!-- captions -->
  <text x="310" y="740" font-size="20" fill="#6B6F76" text-anchor="middle">Figma + code + tokens</text>
  <text x="800" y="740" font-size="20" fill="#6B6F76" text-anchor="middle">What was in your head, written down</text>
  <text x="1290" y="740" font-size="20" fill="#6B6F76" text-anchor="middle">Consistent UI, first try</text>
</g></svg>
