"use client"

import { useEffect, useState, useCallback } from "react"
import * as Tone from "tone"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Square } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"

interface Track {
  name: string;
  color: string;
  synth: string;
}

type PatternNumber  = 1 | 2 | 3 | 4;
type Patterns = {
  [key in PatternNumber]: boolean[][];
};

const TRACKS: Track[] = [
  { name: "Kick", color: "green", synth: "membrane" },
  { name: "Snare", color: "pink", synth: "membrane" },
  { name: "Closed Hat", color: "orange", synth: "metal" },
  { name: "Open Hat", color: "yellow", synth: "metal" },
  { name: "Toms", color: "cyan", synth: "membrane" },
  { name: "Percussion", color: "purple", synth: "membrane" },
  { name: "Fx/Sample", color: "blue", synth: "synth" },
  { name: "Synth", color: "red", synth: "synth" },
]

const STEPS = 16
const INITIAL_BPM = 146
const INITIAL_VOLUME = 83

export default function FartsDj() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [bpm, setBpm] = useState(INITIAL_BPM)
  const [volume, setVolume] = useState(INITIAL_VOLUME)
  const [currentPattern, setCurrentPattern] = useState<PatternNumber>(1)
  const [patterns, setPatterns] = useState<Patterns>({
    1: TRACKS.map(() => Array(STEPS).fill(false)),
    2: TRACKS.map(() => Array(STEPS).fill(false)),
    3: TRACKS.map(() => Array(STEPS).fill(false)),
    4: TRACKS.map(() => Array(STEPS).fill(false)),
  })

  const [instruments] = useState(() =>
    TRACKS.map(track => {
      switch (track.synth) {
        case "membrane":
          return new Tone.MembraneSynth().toDestination()
        case "metal":
          return new Tone.MetalSynth().toDestination()
        case "synth":
          return new Tone.Synth().toDestination()
        default:
          return new Tone.Synth().toDestination()
      }
    })
  )

  useEffect(() => {
    Tone.Transport.bpm.value = bpm
    Tone.Transport.timeSignature = 4
    
    const loop = new Tone.Sequence(
      (time, step) => {
        patterns[currentPattern].forEach((track, trackIndex) => {
          if (track[step]) {
            if (trackIndex <= 4) {
              instruments[trackIndex].triggerAttackRelease("C2", "16n", time)
            } else {
              instruments[trackIndex].triggerAttackRelease("C4", "16n", time)
            }
          }
        })
        setCurrentStep(step)
      },
      [...Array(STEPS).keys()],
      "16n"
    )

    if (isPlaying) {
      Tone.start()
      loop.start(0)
      Tone.Transport.start()
    } else {
      Tone.Transport.stop()
      loop.stop()
    }

    return () => {
      loop.dispose()
    }
  }, [isPlaying, patterns, currentPattern, instruments, bpm])

  useEffect(() => {
    Tone.Destination.volume.value = Tone.gainToDb(volume / 100)
  }, [volume])

  const toggleStep = useCallback((trackIndex: number, stepIndex: number) => {
    setPatterns(prevPatterns => {
      const newPatterns = { ...prevPatterns }
      newPatterns[currentPattern] = [...prevPatterns[currentPattern]]
      newPatterns[currentPattern][trackIndex] = [...prevPatterns[currentPattern][trackIndex]]
      newPatterns[currentPattern][trackIndex][stepIndex] = !newPatterns[currentPattern][trackIndex][stepIndex]
      return newPatterns
    })
  }, [currentPattern])

  const changePattern = (patternNumber: PatternNumber) => {
    setCurrentPattern(patternNumber)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Juice</h1>
          <div className="text-sm opacity-50">
            By John Joseph and Gary Meyer
          </div>
        </div>

        <h2 className="text-7xl font-bold mb-12">Drop a beat.</h2>

        <div className="bg-zinc-900 rounded-lg p-8"> {/* Updated padding */}
          <div className="flex items-center gap-8 mb-8">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              size="icon"
              className={`w-12 h-12 ${
                isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {isPlaying ? <Square className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm">Tempo:</span>
              <span className="font-mono">{bpm}</span>
              <span className="text-sm opacity-50">bpm</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Master Volume:</span>
              <Slider
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
                max={100}
                step={1}
                className="w-32"
              />
              <span className="font-mono w-8">{volume}%</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Steps:</span>
              <span className="font-mono">{STEPS}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm">Prep Pattern:</span>
            {([1, 2, 3, 4] as const).map((num) => (
              <Button
                key={num}
                variant={currentPattern === num ? "default" : "secondary"}
                onClick={() => changePattern(num)}
                className={`
                  w-8 h-8 rounded-md
                  ${currentPattern === num
                    ? 'bg-zinc-800 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.1),_inset_2px_2px_5px_rgba(0,0,0,0.5)]'
                    : 'bg-zinc-700 shadow-[-2px_-2px_5px_rgba(255,255,255,0.1),_2px_2px_5px_rgba(0,0,0,0.5)]'}
                  hover:shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.1),_inset_2px_2px_5px_rgba(0,0,0,0.5)]
                  transition-shadow
                `}
              >
                {num}
              </Button>
            ))}
          </div>

          <div className="grid gap-1">
            {patterns[currentPattern].map((track, trackIndex) => (
              <div key={TRACKS[trackIndex].name} className="flex items-center gap-4">
                <Card className={`w-28 p-2 shadow-md border-t border-zinc-800 rounded-none bg-${TRACKS[trackIndex].color}-500`}>
                  <CardContent className="p-0">
                    <p className="text-sm text-right text-white">{TRACKS[trackIndex].name}</p>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-[repeat(16,1fr)] gap-1 flex-1">
                  {track.map((isActive, stepIndex) => (
                    <button
                      key={stepIndex}
                      onClick={() => toggleStep(trackIndex, stepIndex)}
                      className={`
                        w-full h-8 rounded-md transition-all relative overflow-hidden
                        ${isActive
                          ? `bg-${TRACKS[trackIndex].color}-500 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.2),_inset_2px_2px_5px_rgba(0,0,0,0.3)]`
                          : 'bg-zinc-800 shadow-[-2px_-2px_5px_rgba(255,255,255,0.1),_2px_2px_5px_rgba(0,0,0,0.5)]'}
                        ${currentStep === stepIndex ? "ring-1 ring-white ring-opacity-50" : ""}
                        hover:shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.1),_inset_2px_2px_5px_rgba(0,0,0,0.5)]
                      `}
                    >
                      {isActive && (
                        <div className={`
                          absolute inset-0 bg-gradient-to-br from-transparent via-${TRACKS[trackIndex].color}-400 to-transparent
                          transform rotate-45 scale-150
                        `} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}