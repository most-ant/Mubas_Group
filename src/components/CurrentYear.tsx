'use client'
import { useSyncExternalStore } from 'react'

const currentYear = new Date().getFullYear()

function subscribe() {
  return () => {}
}

function getYear() {
  return currentYear
}

function getServerYear() {
  return currentYear
}

export default function CurrentYear() {
  const year = useSyncExternalStore(subscribe, getYear, getServerYear)
  return <>{year}</>
}
