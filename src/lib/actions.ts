'use server'

import { revalidatePath } from 'next/cache'
import { _setUserStatus, _setListingStatus, _setDocStatus, _setMessageFlag } from './data'

export async function verifyUser(id: string) {
  _setUserStatus(id, 'verified')
  revalidatePath('/users')
  revalidatePath('/')
}

export async function kickUser(id: string) {
  _setUserStatus(id, 'kicked')
  revalidatePath('/users')
  revalidatePath('/')
}

export async function restoreUser(id: string) {
  _setUserStatus(id, 'verified')
  revalidatePath('/users')
}

export async function approveListing(id: string) {
  _setListingStatus(id, 'approved')
  revalidatePath('/listings')
  revalidatePath('/')
}

export async function rejectListing(id: string) {
  _setListingStatus(id, 'removed')
  revalidatePath('/listings')
  revalidatePath('/')
}

export async function removeListing(id: string) {
  _setListingStatus(id, 'removed')
  revalidatePath('/listings')
}

export async function restoreListing(id: string) {
  _setListingStatus(id, 'pending')
  revalidatePath('/listings')
}

export async function approveDoc(id: string) {
  _setDocStatus(id, 'approved')
  revalidatePath('/documents')
}

export async function rejectDoc(id: string) {
  _setDocStatus(id, 'rejected')
  revalidatePath('/documents')
}

export async function resolveMessage(id: string) {
  _setMessageFlag(id, false)
  revalidatePath('/messages')
  revalidatePath('/')
}
