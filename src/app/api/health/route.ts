import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({status:"ok",service:"raaha-ai-mock-interview",timestamp:new Date().toISOString()}); }