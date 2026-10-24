// Generates the static social card and PNG icons using native macOS drawing.
// Run on macOS: swift scripts/generate-social-assets.swift
import AppKit

func color(_ hex: UInt32, alpha: CGFloat = 1) -> NSColor {
    NSColor(srgbRed: CGFloat((hex >> 16) & 255) / 255,
            green: CGFloat((hex >> 8) & 255) / 255,
            blue: CGFloat(hex & 255) / 255, alpha: alpha)
}

// Apple outline adapted from Lucide (ISC).
// Copyright (c) Lucide Contributors 2022. Portions copyright Cole Bemis
// 2013-2022 as part of Feather (MIT).
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
func apple(in frame: NSRect, stroke: NSColor) {
    let scale = frame.width / 24
    func p(_ x: CGFloat, _ y: CGFloat) -> NSPoint {
        NSPoint(x: frame.minX + x * scale, y: frame.maxY - y * scale)
    }
    let path = NSBezierPath()
    path.lineWidth = 1.5 * scale
    path.lineCapStyle = .round
    path.lineJoinStyle = .round
    path.move(to: p(12, 20.94))
    path.curve(to: p(16, 22), controlPoint1: p(13.5, 20.94), controlPoint2: p(14.75, 22))
    path.curve(to: p(22, 9.78), controlPoint1: p(19, 22), controlPoint2: p(22, 14))
    path.curve(to: p(17, 5), controlPoint1: p(22, 7.1), controlPoint2: p(19.8, 5))
    path.curve(to: p(12, 7), controlPoint1: p(14.78, 5), controlPoint2: p(13, 6.44))
    path.curve(to: p(7, 5), controlPoint1: p(11, 6.44), controlPoint2: p(9.22, 5))
    path.curve(to: p(2, 9.78), controlPoint1: p(4.2, 5), controlPoint2: p(2, 7.1))
    path.curve(to: p(8, 22), controlPoint1: p(2, 14), controlPoint2: p(5, 22))
    path.curve(to: p(12, 20.94), controlPoint1: p(9.25, 22), controlPoint2: p(10.5, 20.94))
    path.close()
    path.move(to: p(10, 2))
    path.curve(to: p(12, 7), controlPoint1: p(11, 2.5), controlPoint2: p(12, 4))
    stroke.setStroke()
    path.stroke()
}

func logo(in frame: NSRect) {
    let box = NSBezierPath(roundedRect: frame.insetBy(dx: 1, dy: 1), xRadius: frame.width * 0.3, yRadius: frame.width * 0.3)
    color(0x222222).setFill()
    box.fill()
    color(0x444444).setStroke()
    box.lineWidth = max(1, frame.width / 40)
    box.stroke()
    apple(in: frame.insetBy(dx: frame.width * 0.26, dy: frame.width * 0.26), stroke: .white)
}

func renderImage(width: Int, height: Int, path: String, draw: (NSRect) -> Void) throws {
    guard let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0),
        let context = NSGraphicsContext(bitmapImageRep: bitmap) else { fatalError("Cannot create image") }
    bitmap.size = NSSize(width: width, height: height)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    context.shouldAntialias = true
    draw(NSRect(x: 0, y: 0, width: width, height: height))
    context.flushGraphics()
    NSGraphicsContext.restoreGraphicsState()
    let jpeg = path.hasSuffix(".jpg")
    guard let data = bitmap.representation(using: jpeg ? .jpeg : .png, properties: jpeg ? [.compressionFactor: 0.88] : [:]) else { fatalError("Cannot encode image") }
    try data.write(to: URL(fileURLWithPath: path))
}

for size in [32, 180] {
    let destination = size == 32 ? "public/favicon-32.png" : "public/apple-touch-icon.png"
    try renderImage(width: size, height: size, path: destination) { frame in logo(in: frame) }
}

try renderImage(width: 1200, height: 630, path: "public/social-preview.jpg") { bounds in
    color(0x09090b).setFill()
    bounds.fill()
    NSGradient(starting: color(0x191126), ending: color(0x09090b))?.draw(in: bounds, angle: -30)
    apple(in: NSRect(x: 865, y: 215, width: 265, height: 265), stroke: color(0xffffff, alpha: 0.045))

    func text(_ value: String, x: CGFloat, top: CGFloat, size: CGFloat, weight: NSFont.Weight = .regular, ink: NSColor = .white) {
        let string = NSAttributedString(string: value, attributes: [
            .font: NSFont.systemFont(ofSize: size, weight: weight), .foregroundColor: ink,
        ])
        string.draw(at: NSPoint(x: x, y: bounds.height - top - string.size().height))
    }

    text("TICKET ANALYZER · NOVA", x: 76, top: 55, size: 15, weight: .medium, ink: color(0xc4b5fd))
    logo(in: NSRect(x: 76, y: 630 - 118 - 104, width: 104, height: 104))
    text("TicketNova", x: 208, top: 120, size: 66, weight: .bold)
    text("Tu compra, con", x: 76, top: 274, size: 56, weight: .semibold)
    text("próximos pasos.", x: 76, top: 341, size: 56, weight: .semibold)
    text("Sube tu ticket. Descubre qué mantener, reducir o añadir.", x: 76, top: 440, size: 23, ink: color(0xc3c0ca))

    color(0xffffff, alpha: 0.12).setStroke()
    let divider = NSBezierPath()
    divider.move(to: NSPoint(x: 76, y: 105))
    divider.line(to: NSPoint(x: 1124, y: 105))
    divider.stroke()
    text("ticketnova-lyart.vercel.app", x: 76, top: 552, size: 18, ink: color(0xb3aebd))
    text("Perfil → Ticket → Análisis", x: 826, top: 552, size: 18, ink: color(0xc4b5fd))
}
print("Generated social-preview.jpg (1200×630), favicon-32.png and apple-touch-icon.png")
