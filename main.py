import os
import sys
import time
import argparse
import yt_dlp
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

def setup_gemini():
    """Configures the Gemini API client."""
    if not API_KEY:
        print("❌ Error: GOOGLE_API_KEY not found in environment variables.")
        print("Please create a .env file with your API key based on .env.example")
        sys.exit(1)
    genai.configure(api_key=API_KEY)

def download_audio(url):
    """Downloads audio from YouTube URL as a low-bitrate MP3."""
    print("\n⬇️  Step 1: Downloading audio from YouTube...")
    timestamp = int(time.time())
    output_template = f"temp_audio_{timestamp}"
    
    # Configure yt-dlp for low bitrate mp3 to save bandwidth
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '64', # 64kbps is sufficient for speech recognition
        }],
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            video_title = info.get('title', f'video_{timestamp}')
            # yt-dlp automatically appends the extension
            final_filename = f"{output_template}.mp3"
            print(f"   ✅ Downloaded: {video_title}")
            return final_filename, video_title
    except Exception as e:
        print(f"   ❌ Download failed: {str(e)}")
        sys.exit(1)

def upload_to_gemini(file_path):
    """Uploads the local audio file to Gemini File API."""
    print("\n📤 Step 2: Uploading to Gemini...")
    if not os.path.exists(file_path):
        print(f"   ❌ Error: File {file_path} not found.")
        sys.exit(1)
        
    try:
        # Get file size for user info
        file_size = os.path.getsize(file_path) / (1024 * 1024)
        print(f"   File size: {file_size:.2f} MB")
        
        g_file = genai.upload_file(file_path, mime_type="audio/mp3")
        print(f"   ✅ Uploaded. URI: {g_file.uri}")
        return g_file
    except Exception as e:
        print(f"   ❌ Upload failed: {str(e)}")
        sys.exit(1)

def wait_for_processing(g_file):
    """Waits for the uploaded file to be processed by Gemini."""
    print("\n⏳ Step 3: Waiting for server-side processing...")
    while True:
        file = genai.get_file(g_file.name)
        if file.state.name == "ACTIVE":
            print("   ✅ File is ready for inference.")
            break
        elif file.state.name == "FAILED":
            print("   ❌ File processing failed on Gemini side.")
            sys.exit(1)
        
        print("   Processing...", end="\r")
        time.sleep(2)

def generate_subtitles(g_file):
    """Sends the file to Gemini 1.5 Flash and requests VTT output."""
    print("\n🧠 Step 4: Transcribing with Gemini 1.5 Flash...")
    
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    prompt = """
    You are a professional subtitle generator. 
    Transcribe the audio from the provided file into English.
    Strictly output the result in WebVTT (.vtt) format.
    Ensure timestamps are accurate and formatted correctly (e.g., 00:00:00.000).
    Do not include any conversational text, markdown formatting blocks (like ```vtt), or explanations. 
    Start directly with "WEBVTT".
    """
    
    try:
        # Increased timeout to accommodate longer videos
        response = model.generate_content(
            [g_file, prompt],
            request_options={"timeout": 600} 
        )
        return response.text
    except Exception as e:
        print(f"   ❌ Transcription error: {str(e)}")
        sys.exit(1)

def save_vtt(content, video_title):
    """Saves the content to a .vtt file."""
    print("\n💾 Step 5: Saving output...")
    # Sanitize filename
    safe_title = "".join(c for c in video_title if c.isalnum() or c in (' ', '-', '_')).strip()
    output_filename = f"{safe_title}.vtt"
    
    # Clean markdown code blocks if model included them
    clean_content = content.replace("```vtt", "").replace("```", "").strip()
    
    # Fallback cleanup if the model was chatty
    if not clean_content.startswith("WEBVTT"):
        print("   ⚠️  Warning: Output might contain extra text. Cleaning...")
        start_idx = clean_content.find("WEBVTT")
        if start_idx != -1:
            clean_content = clean_content[start_idx:]
    
    try:
        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(clean_content)
        print(f"   ✅ Saved to: {os.path.abspath(output_filename)}")
    except Exception as e:
        print(f"   ❌ Save failed: {str(e)}")

def cleanup(file_path, g_file=None):
    """Removes temporary local and remote files."""
    print("\n🧹 Step 6: Cleanup...")
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print("   Deleted local temporary audio file.")
        except Exception as e:
            print(f"   Warning: Could not delete local file: {e}")
    
    if g_file:
        try:
            genai.delete_file(g_file.name)
            print("   Deleted remote Gemini file.")
        except Exception:
            pass

def main():
    parser = argparse.ArgumentParser(description="YouTube to WebVTT Subtitle Generator using Gemini 1.5 Flash")
    parser.add_argument("url", nargs="?", help="YouTube Video URL")
    args = parser.parse_args()

    setup_gemini()

    url = args.url
    if not url:
        print("📝 Enter YouTube URL:")
        url = input("> ").strip()
    
    if not url:
        print("❌ No URL provided.")
        sys.exit(1)

    audio_path = None
    g_file = None

    try:
        audio_path, title = download_audio(url)
        g_file = upload_to_gemini(audio_path)
        wait_for_processing(g_file)
        vtt_content = generate_subtitles(g_file)
        save_vtt(vtt_content, title)
        print("\n✨ All done!")
        
    except KeyboardInterrupt:
        print("\n\n🛑 Operation cancelled by user.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
    finally:
        if audio_path:
            cleanup(audio_path, g_file)

if __name__ == "__main__":
    main()
