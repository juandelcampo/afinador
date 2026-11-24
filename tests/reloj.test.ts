// El reloj común: un tempo y una cuenta de pulsos para todo lo que suena junto.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const audio = vi.hoisted(() => ({ currentTime: 10 }));
vi.mock('~/audio/engine', () => ({ getAudio: () => ({ ctx: audio }) }));
vi.mock('~/audio/ticker', () => ({ createTicker: () => ({ start() {}, stop() {} }) }));

const { transport } = await import('~/audio/transport');

describe('reloj común', () => {
  const parts: Array<() => void> = [];
  const voice = () => {
    const part = () => undefined;
    parts.push(part);
    return part;
  };

  beforeEach(() => {
    parts.splice(0).forEach((part) => transport.leave(part));
    audio.currentTime = 10;
  });

  it('la primera parte arranca la cuenta de cero, con su tempo', () => {
    expect(transport.join(voice(), 120)).toBe(0);
    expect(transport.bpm).toBe(120);
    expect(transport.running).toBe(true);
    expect(transport.timeOf(2) - transport.timeOf(0)).toBeCloseTo(1);
  });

  it('la que entra después cae en un pulso entero y no cambia el tempo', () => {
    transport.join(voice(), 120);
    audio.currentTime += 1.3;
    const start = transport.join(voice(), 60);
    expect(Number.isInteger(start)).toBe(true);
    expect(transport.timeOf(start)).toBeGreaterThan(audio.currentTime);
    expect(transport.bpm).toBe(120);
  });

  it('cambiar el tempo no hace saltar la cuenta', () => {
    transport.join(voice(), 100);
    audio.currentTime += 2;
    const before = transport.beatAt(audio.currentTime);
    transport.setBpm(150);
    expect(transport.beatAt(audio.currentTime)).toBeCloseTo(before);
    expect(transport.timeOf(before + 3) - audio.currentTime).toBeCloseTo(3 * 0.4);
  });

  it('cuando se va la última parte, el reloj se para y la próxima empieza de cero', () => {
    const part = voice();
    transport.join(part, 100);
    audio.currentTime += 5;
    transport.leave(part);
    expect(transport.running).toBe(false);
    expect(transport.join(voice(), 90)).toBe(0);
  });
});
