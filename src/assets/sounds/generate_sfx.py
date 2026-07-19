import math
import struct
import wave
import os
import subprocess

SAMPLE_RATE = 44100

def save_wav(filename, samples):
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(SAMPLE_RATE)
        for s in samples:
            # Clip and scale to 16-bit signed integer
            val = max(-32768, min(32767, int(s * 32767)))
            wav_file.writeframesraw(struct.pack('<h', val))

def make_chime_note(freq, duration, envelope_type='bell', harmonics=[(1, 1.0), (2, 0.5), (3, 0.25)]):
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Envelope
        if envelope_type == 'bell':
            # Fast attack, exponential decay
            attack = min(1.0, t / 0.01)
            decay = math.exp(-6.0 * t)
            env = attack * decay
        elif envelope_type == 'soft':
            # Soft attack and decay (for oops sound)
            attack = min(1.0, t / 0.05)
            decay = math.exp(-4.0 * t)
            env = attack * decay
        elif envelope_type == 'linear':
            # Linear decay
            env = max(0.0, 1.0 - (t / duration))
        else:
            env = 1.0
            
        # Wave sum of harmonics
        val = 0.0
        for h_num, h_amp in harmonics:
            val += h_amp * math.sin(2 * math.pi * freq * h_num * t)
            
        # Normalize sum of harmonics to max 1.0 before envelope
        total_amp = sum(h_amp for _, h_amp in harmonics)
        val = (val / total_amp) * env
        samples.append(val)
    return samples

def mix_samples(tracks):
    # Each track is a tuple of (start_time, samples_list)
    max_len = 0
    for start_time, samples in tracks:
        start_idx = int(SAMPLE_RATE * start_time)
        max_len = max(max_len, start_idx + len(samples))
        
    mixed = [0.0] * max_len
    for start_time, samples in tracks:
        start_idx = int(SAMPLE_RATE * start_time)
        for i, s in enumerate(samples):
            mixed[start_idx + i] += s
            
    # Normalize mix to prevent clipping
    max_val = max(abs(x) for x in mixed) if mixed else 0
    if max_val > 0.95:
        mixed = [x * (0.95 / max_val) for x in mixed]
        
    return mixed

def generate_reward_1():
    # Short cheerful "ding" chime for +1. High frequency, quick decay
    # G5 (784 Hz) chime
    samples = make_chime_note(783.99, duration=0.5, envelope_type='bell', harmonics=[(1, 1.0), (2, 0.4), (3, 0.15)])
    save_wav('reward-1.wav', samples)

def generate_reward_2():
    # Slightly bigger two-tone chime for +2
    # E5 (659 Hz) then A5 (880 Hz)
    note1 = make_chime_note(659.25, duration=0.4, envelope_type='bell')
    note2 = make_chime_note(880.00, duration=0.5, envelope_type='bell')
    
    mixed = mix_samples([
        (0.0, note1),
        (0.12, note2)
    ])
    save_wav('reward-2.wav', mixed)

def generate_reward_3():
    # Triumphant short fanfare for +3
    # Bright arpeggio: C5 (523 Hz), E5 (659 Hz), G5 (784 Hz), C6 (1046 Hz)
    # Trumpet/fanfare style harmonics (more odd/even harmonics)
    harmonics = [(1, 1.0), (2, 0.6), (3, 0.4), (4, 0.2), (5, 0.1)]
    note1 = make_chime_note(523.25, duration=0.3, envelope_type='bell', harmonics=harmonics)
    note2 = make_chime_note(659.25, duration=0.3, envelope_type='bell', harmonics=harmonics)
    note3 = make_chime_note(783.99, duration=0.3, envelope_type='bell', harmonics=harmonics)
    note4 = make_chime_note(1046.50, duration=0.6, envelope_type='bell', harmonics=harmonics)
    
    mixed = mix_samples([
        (0.0, note1),
        (0.08, note2),
        (0.16, note3),
        (0.24, note4)
    ])
    save_wav('reward-3.wav', mixed)

def generate_discipline():
    # Soft, kid-friendly "oops" tone. Descending xylophone notes (e.g. C5 -> A4 -> F4)
    # Soft attack, rapid decay, triangle/sine mix (pure sine/triangle mix)
    harmonics = [(1, 1.0), (2, 0.1)] # Very clean, pure xylophone-like tone
    note1 = make_chime_note(523.25, duration=0.25, envelope_type='soft', harmonics=harmonics) # C5
    note2 = make_chime_note(440.00, duration=0.25, envelope_type='soft', harmonics=harmonics) # A4
    note3 = make_chime_note(349.23, duration=0.4, envelope_type='soft', harmonics=harmonics)  # F4
    
    mixed = mix_samples([
        (0.0, note1),
        (0.12, note2),
        (0.24, note3)
    ])
    save_wav('discipline.wav', mixed)

def convert_to_mp3(wav_filename, mp3_filename):
    print(f"Converting {wav_filename} to {mp3_filename}...")
    subprocess.run([
        'ffmpeg', '-y',
        '-i', wav_filename,
        '-codec:a', 'libmp3lame',
        '-b:a', '128k',
        mp3_filename
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.remove(wav_filename)

if __name__ == '__main__':
    print("Generating WAV files...")
    generate_reward_1()
    generate_reward_2()
    generate_reward_3()
    generate_discipline()
    
    print("Converting to MP3 files...")
    convert_to_mp3('reward-1.wav', 'reward-1.mp3')
    convert_to_mp3('reward-2.wav', 'reward-2.mp3')
    convert_to_mp3('reward-3.wav', 'reward-3.mp3')
    convert_to_mp3('discipline.wav', 'discipline.mp3')
    
    print("Audio assets generated successfully!")
