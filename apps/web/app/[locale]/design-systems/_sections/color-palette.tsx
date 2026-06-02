/**
 * Color Palette specimen — 1:1 mirror of Figma node 40009046:20492.
 * Used only by the `/design-systems` showcase page.
 */
type ColorSwatchProps = {
  name: string
  hex: string
  bg: string
  textColor: 'white' | 'black'
  bordered?: boolean
  /** width / height ratio as a CSS aspect-ratio string (e.g. "1400/559"). */
  aspect: string
}

function ColorSwatch({
  name,
  hex,
  bg,
  textColor,
  bordered,
  aspect,
}: ColorSwatchProps) {
  return (
    <div
      className={`relative w-full overflow-hidden ${bg} ${bordered ? 'border border-black' : ''}`}
      style={{ aspectRatio: aspect }}
    >
      <div
        className={`absolute right-[9px] bottom-[9px] left-[9px] overflow-hidden ${textColor === 'white' ? 'text-white' : 'text-black'}`}
      >
        <p className="truncate text-[10px] leading-[1.2] md:text-[16px]">
          {name}
        </p>
        <p className="truncate text-[10px] leading-[1.2] md:text-[16px]">
          {hex}
        </p>
      </div>
    </div>
  )
}

export function ColorPalette() {
  return (
    <div className="font-sans flex w-full flex-col gap-6 bg-white p-5">
      {/* Header */}
      <div className="flex w-full max-w-[343px] items-center justify-between text-[18px] leading-[1.2] text-black">
        <p>Logos Design System</p>
        <p>Color Palette</p>
      </div>

      {/* Dark Green */}
      <ColorSwatch
        name="Dark Green"
        hex="#152521"
        bg="bg-brand-dark-green"
        textColor="white"
        aspect="1400/559"
      />

      {/* Dark Green 50% / 10% / 5% */}
      <div className="flex w-full items-start gap-6">
        <div className="flex-1">
          <ColorSwatch
            name="Dark Green 50%"
            hex="#152521 50%"
            bg="bg-brand-dark-green/50"
            textColor="white"
            aspect="450/227"
          />
        </div>
        <div className="flex-1">
          <ColorSwatch
            name="Dark Green 10%"
            hex="#152521 10%"
            bg="bg-brand-dark-green/10"
            textColor="black"
            bordered
            aspect="450/227"
          />
        </div>
        <div className="flex-1">
          <ColorSwatch
            name="Dark Green 5%"
            hex="#152521 5%"
            bg="bg-brand-dark-green/5"
            textColor="black"
            bordered
            aspect="450/227"
          />
        </div>
      </div>

      {/* Off-White */}
      <ColorSwatch
        name="Off-White"
        hex="#F5F5EF"
        bg="bg-brand-off-white"
        textColor="black"
        bordered
        aspect="1400/416"
      />

      {/* Off-White 50% / 10% */}
      <div className="flex w-full items-start gap-6">
        <div className="flex-1">
          <ColorSwatch
            name="Off-White 50%"
            hex="#F5F5EF 50%"
            bg="bg-brand-off-white/50"
            textColor="black"
            bordered
            aspect="688/227"
          />
        </div>
        <div className="flex-1">
          <ColorSwatch
            name="Off-White 10%"
            hex="#F5F5EF 10%"
            bg="bg-brand-off-white/10"
            textColor="black"
            bordered
            aspect="688/227"
          />
        </div>
      </div>

      {/* Accent bands */}
      <ColorSwatch
        name="Steel Teal"
        hex="#5F797C"
        bg="bg-accent-steel-teal"
        textColor="white"
        aspect="1400/227"
      />
      <ColorSwatch
        name="Light Blue"
        hex="#C6EBF7"
        bg="bg-accent-light-blue"
        textColor="black"
        aspect="1400/227"
      />
      <ColorSwatch
        name="Tan"
        hex="#E2E0C9"
        bg="bg-accent-tan"
        textColor="black"
        aspect="1400/227"
      />
      <ColorSwatch
        name="Brown"
        hex="#A18863"
        bg="bg-accent-brown"
        textColor="black"
        aspect="1400/227"
      />
      <ColorSwatch
        name="Yellow"
        hex="#FFD328"
        bg="bg-brand-yellow"
        textColor="black"
        aspect="1400/227"
      />
      <ColorSwatch
        name="Purple"
        hex="#48373F"
        bg="bg-accent-purple"
        textColor="white"
        aspect="1400/227"
      />

      {/* Grey ramp */}
      <div className="flex w-full items-start gap-6">
        <div className="flex-1">
          <ColorSwatch
            name="Grey 01"
            hex="#DBDDD7"
            bg="bg-gray-01"
            textColor="black"
            aspect="213/227"
          />
        </div>
        <div className="flex-1">
          <ColorSwatch
            name="Grey 02"
            hex="#B8BDB8"
            bg="bg-gray-02"
            textColor="black"
            aspect="213/227"
          />
        </div>
        <div className="flex-1">
          <ColorSwatch
            name="Grey 03"
            hex="#9EA5A0"
            bg="bg-gray-03"
            textColor="black"
            aspect="213/227"
          />
        </div>
        <div className="flex-1">
          <ColorSwatch
            name="Grey 04"
            hex="#848E88"
            bg="bg-gray-04"
            textColor="white"
            aspect="213/227"
          />
        </div>
        <div className="flex-1">
          <ColorSwatch
            name="Grey 05"
            hex="#616E69"
            bg="bg-gray-05"
            textColor="white"
            aspect="213/227"
          />
        </div>
        <div className="flex-1">
          <ColorSwatch
            name="Grey 06"
            hex="#475651"
            bg="bg-gray-06"
            textColor="white"
            aspect="213/227"
          />
        </div>
      </div>
    </div>
  )
}
