import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log("API ROUTE HIT!")
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    return NextResponse.json({
      success: true,
      message: "API is working!",
      fileName: file?.name,
      fileSize: file?.size
    })
    
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ success: false, error: String(error) })
  }
}