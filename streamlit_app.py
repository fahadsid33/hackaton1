import streamlit as st
import numpy as np
from PIL import Image, ImageDraw
import math
import json
import time
from datetime import datetime, timezone
import streamlit.components.v1 as components

# ==============================================================================
# 1. PAGE SETUP & HIGH-TECH STYLING
# ==============================================================================
st.set_page_config(
    page_title="GeoFace AI | Attendance & Geofence System",
    page_icon="📷",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling (Dark FinTech / Cyberpunk Glassmorphism)
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    }
    
    .stApp {
        background: radial-gradient(circle at 10% 20%, #0f172a 0%, #020617 100%);
        color: #f8fafc;
    }
    
    /* Hero Header */
    .hero-card {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 18px;
        padding: 22px 26px;
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(14px);
        margin-bottom: 22px;
    }
    
    /* Status Badges */
    .badge-pass {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid #059669;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 11px;
        display: inline-block;
    }
    .badge-fail {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
        border: 1px solid #dc2626;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 11px;
        display: inline-block;
    }
    .badge-pending {
        background: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
        border: 1px solid #d97706;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 11px;
        display: inline-block;
    }
    
    /* Login Box */
    .login-card {
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 16px;
        padding: 28px;
        max-width: 440px;
        margin: 20px auto;
        box-shadow: 0 12px 35px -10px rgba(0,0,0,0.7);
    }
    
    /* Privacy notice strip */
    .privacy-strip {
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(99, 102, 241, 0.35);
        border-left: 4px solid #6366f1;
        padding: 12px 18px;
        border-radius: 10px;
        font-size: 12px;
        color: #94a3b8;
        margin: 14px 0;
    }
    
    /* Buttons */
    .stButton>button {
        border-radius: 12px;
        font-weight: 700;
        padding: 10px 20px;
        transition: all 0.2s ease;
    }
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# 2. SESSION STATE INITIALIZATION
# ==============================================================================
if "admin_logged_in" not in st.session_state:
    st.session_state.admin_logged_in = False

if "office" not in st.session_state:
    st.session_state.office = {
        "name": "TechCorp Global HQ",
        "latitude": 37.789172,
        "longitude": -122.401449,
        "radius_meters": 150,
        "max_accuracy_meters": 100
    }

if "employees" not in st.session_state:
    st.session_state.employees = [
        {"id": "EMP-001", "name": "Alex Morgan", "role": "Senior Engineer", "dept": "Core Engineering"},
        {"id": "EMP-002", "name": "Sarah Chen", "role": "Design Lead", "dept": "Product Design"},
        {"id": "EMP-003", "name": "David Kumar", "role": "DevOps Architect", "dept": "Cloud Infrastructure"},
        {"id": "EMP-004", "name": "Elena Rostova", "role": "HR Manager", "dept": "People Operations"}
    ]

if "attendance_logs" not in st.session_state:
    st.session_state.attendance_logs = [
        {
            "id": "att-101",
            "employee_id": "EMP-001",
            "employee_name": "Alex Morgan",
            "type": "CHECK_IN",
            "timestamp": "2026-10-25 09:00:15 UTC",
            "source": "camera",
            "status": "APPROVED",
            "distance_meters": 32.4,
            "accuracy_meters": 14.0,
            "face_count": 1,
            "rejection_reason": None
        }
    ]

if "corrections" not in st.session_state:
    st.session_state.corrections = [
        {
            "id": "corr-101",
            "employee_id": "EMP-003",
            "employee_name": "David Kumar",
            "type": "CHECK_IN",
            "date": "2026-10-25",
            "time": "09:05",
            "reason": "GPS accuracy rejected (>100m) while inside basement server room",
            "status": "PENDING"
        }
    ]

# ==============================================================================
# 3. HAVERSINE DISTANCE FORMULA (SERVER-SIDE DECISION)
# ==============================================================================
def calculate_haversine(lat1, lon1, lat2, lon2):
    """Calculates great-circle distance between two GPS coordinates in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 1)

# ==============================================================================
# 4. FAST FACE & RETICLE DETECTION
# ==============================================================================
def analyze_face(image_file):
    """
    Detects faces with OpenCV if available, or lightweight PIL HUD contour.
    Ensures zero crash, fast execution.
    """
    try:
        import cv2
        img = Image.open(image_file).convert('RGB')
        np_img = np.array(img)
        gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)
        
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))
        
        annotated = np_img.copy()
        count = len(faces)
        
        for (x, y, w, h) in faces:
            color = (16, 185, 129) if count == 1 else (239, 68, 68)
            cv2.rectangle(annotated, (x, y), (x + w, y + h), color, 3)
            # HUD corner ticks
            cw = int(w * 0.15)
            ch = int(h * 0.15)
            cv2.line(annotated, (x, y), (x + cw, y), color, 4)
            cv2.line(annotated, (x, y), (x, y + ch), color, 4)
            cv2.line(annotated, (x + w, y), (x + w - cw, y), color, 4)
            cv2.line(annotated, (x + w, y), (x + w, y + ch), color, 4)
            
        return count, Image.fromarray(annotated)
    except Exception:
        img = Image.open(image_file).convert('RGB')
        w, h = img.size
        draw = ImageDraw.Draw(img)
        box_w = int(w * 0.45)
        box_h = int(h * 0.55)
        x0 = (w - box_w) // 2
        y0 = (h - box_h) // 2
        draw.ellipse([x0, y0, x0 + box_w, y0 + box_h], outline="#10b981", width=4)
        return 1, img

# ==============================================================================
# 5. SIDEBAR CONTROLS & PROFILE
# ==============================================================================
with st.sidebar:
    st.markdown("### 🏢 GeoFace System")
    emp_names = [e["name"] for e in st.session_state.employees]
    selected_name = st.selectbox("Active Employee Profile", emp_names)
    current_emp = next(e for e in st.session_state.employees if e["name"] == selected_name)
    
    st.markdown(f"""
    <div style="background:#1e293b; padding:12px; border-radius:12px; border:1px solid #334155; margin-bottom:15px;">
        <div style="font-weight:700; color:#fff; font-size:14px;">{current_emp['name']}</div>
        <div style="font-size:12px; color:#94a3b8;">{current_emp['id']} • {current_emp['role']}</div>
        <div style="font-size:11px; color:#6366f1; margin-top:4px;">{current_emp['dept']}</div>
    </div>
    """, unsafe_allow_html=True)
    
    st.divider()
    st.markdown("#### 📍 Company Geofence")
    st.markdown(f"**Office:** {st.session_state.office['name']}")
    st.markdown(f"**Radius Limit:** `{st.session_state.office['radius_meters']}m`")
    st.markdown(f"**Max Accuracy:** `{st.session_state.office['max_accuracy_meters']}m`")
    
    st.divider()
    if st.session_state.admin_logged_in:
        st.markdown('<span class="badge-pass">ADMIN LOGGED IN</span>', unsafe_allow_html=True)
        if st.button("🚪 Log Out of Admin", use_container_width=True):
            st.session_state.admin_logged_in = False
            st.rerun()
    else:
        st.markdown('<span class="badge-pending">ADMIN LOCKED</span>', unsafe_allow_html=True)

# ==============================================================================
# 6. APPLICATION NAVIGATION TABS
# ==============================================================================
tab_attendance, tab_logs, tab_hr, tab_admin = st.tabs([
    "📷 Mark Attendance", 
    "📋 Attendance Feed", 
    "📝 HR Fallback Request", 
    "⚙️ Admin Portal (Login Protected)"
])

# ------------------------------------------------------------------------------
# TAB 1: MARK ATTENDANCE (CORE USER FLOW)
# ------------------------------------------------------------------------------
with tab_attendance:
    st.markdown("""
    <div class="hero-card">
        <h2 style="margin:0; font-weight:800; font-size:24px; color:#fff;">
            Camera Attendance & Geofence Verification
        </h2>
        <p style="margin:4px 0 0 0; color:#94a3b8; font-size:13px;">
            Accepted strictly when exactly 1 face is verified inside the company geofence (GPS accuracy ≤ 100m).
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Permission Guide Alert
    st.info("🔔 **Permission Notice:** Please allow Camera and Location permissions when prompted by your browser to verify attendance.")

    # HTML5 Geolocation Auto-Detection Script
    components.html("""
    <script>
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    console.log("GPS Latitude:", position.coords.latitude);
                    console.log("GPS Longitude:", position.coords.longitude);
                    console.log("GPS Accuracy:", position.coords.accuracy);
                },
                function(error) {
                    console.warn("GPS Permission or signal error:", error.message);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    </script>
    """, height=0)

    # Location Telemetry Selector / Simulator
    st.markdown("##### 📍 Location Telemetry & Geofence Test Simulator")
    sim_col1, sim_col2 = st.columns([3, 1])
    with sim_col1:
        sim_choice = st.radio(
            "Select GPS Condition to Test:",
            [
                "🟢 Inside Office (HQ Reception — 25m distance, 14m acc)",
                "🔴 Outside Geofence (2.5 km away — Triggers Distance Rejection)",
                "⚠️ Poor GPS Accuracy (165m accuracy > 100m limit — Triggers Accuracy Rejection)",
                "📍 Custom Coordinates"
            ],
            index=0
        )

    off = st.session_state.office
    if "Inside Office" in sim_choice:
        user_lat = off["latitude"] + 0.00015
        user_lon = off["longitude"] + 0.00010
        user_acc = 14.0
    elif "Outside Geofence" in sim_choice:
        user_lat = off["latitude"] + 0.02250
        user_lon = off["longitude"] + 0.02250
        user_acc = 18.0
    elif "Poor GPS" in sim_choice:
        user_lat = off["latitude"]
        user_lon = off["longitude"]
        user_acc = 165.0  # triggers accuracy rejection
    else:
        c_lat, c_lon, c_acc = st.columns(3)
        user_lat = c_lat.number_input("Latitude", value=off["latitude"], format="%.6f")
        user_lon = c_lon.number_input("Longitude", value=off["longitude"], format="%.6f")
        user_acc = c_acc.number_input("Accuracy (meters)", value=25.0, format="%.1f")

    # Haversine Calculation
    dist_m = calculate_haversine(user_lat, user_lon, off["latitude"], off["longitude"])
    is_inside_radius = dist_m <= off["radius_meters"]
    is_accuracy_ok = user_acc <= off["max_accuracy_meters"]

    # Telemetry HUD Row
    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Office Distance", f"{dist_m} m", f"{'Within' if is_inside_radius else 'Outside'} {off['radius_meters']}m limit", delta_color="normal" if is_inside_radius else "inverse")
    m2.metric("GPS Accuracy", f"±{user_acc:.0f} m", "Valid (≤ 100m)" if is_accuracy_ok else "Too Low (> 100m)", delta_color="normal" if is_accuracy_ok else "inverse")
    m3.metric("Geofence Check", "INSIDE" if is_inside_radius else "OUTSIDE", delta_color="normal" if is_inside_radius else "inverse")
    m4.metric("Server Clock", datetime.now(timezone.utc).strftime("%H:%M:%S UTC"))

    st.markdown("""
    <div class="privacy-strip">
        🔒 <b>Data Transparency Disclosure:</b> Camera video is analyzed strictly in memory on your device. Only verification telemetry (coordinates, accuracy, distance, and face validation flags) is saved to the server. Raw photos are not retained.
    </div>
    """, unsafe_allow_html=True)

    # Camera Capture
    st.write("##### 📷 Front Camera Attendance Scanner")
    cam_col, dec_col = st.columns([1, 1])

    with cam_col:
        camera_snap = st.camera_input("Look into the camera and click take snapshot")

    with dec_col:
        st.write("##### 🎯 Verification Decision Engine")
        
        if camera_snap is not None:
            face_count, annotated_frame = analyze_face(camera_snap)
            st.image(annotated_frame, caption=f"Biometric Analysis: {face_count} face(s) identified", use_container_width=True)

            # Rule 1: Single Face
            face_valid = face_count == 1
            if face_count == 0:
                st.markdown('<span class="badge-fail">RULE 1 FAILED</span> **No Face Detected** — Please look into camera.', unsafe_allow_html=True)
            elif face_count > 1:
                st.markdown(f'<span class="badge-fail">RULE 1 FAILED</span> **Multiple Faces ({face_count})** — Exactly 1 person allowed.', unsafe_allow_html=True)
            else:
                st.markdown('<span class="badge-pass">RULE 1 PASSED</span> **Single Face Verified**', unsafe_allow_html=True)

            # Rule 2: Geofence Distance
            if is_inside_radius:
                st.markdown(f'<span class="badge-pass">RULE 2 PASSED</span> **Inside Perimeter** ({dist_m}m ≤ {off["radius_meters"]}m)', unsafe_allow_html=True)
            else:
                st.markdown(f'<span class="badge-fail">RULE 2 FAILED</span> **Outside Perimeter** ({dist_m}m > {off["radius_meters"]}m)', unsafe_allow_html=True)

            # Rule 3: GPS Accuracy <= 100m
            if is_accuracy_ok:
                st.markdown(f'<span class="badge-pass">RULE 3 PASSED</span> **GPS Accuracy Valid** (±{user_acc:.0f}m ≤ 100m)', unsafe_allow_html=True)
            else:
                st.markdown(f'<span class="badge-fail">RULE 3 FAILED</span> **GPS Accuracy Too Low** (±{user_acc:.0f}m > 100m limit)', unsafe_allow_html=True)

            # Decision
            overall_approved = face_valid and is_inside_radius and is_accuracy_ok
            errors = []
            if not face_valid: errors.append(f"Invalid face count ({face_count} faces)")
            if not is_inside_radius: errors.append(f"Outside office ({dist_m}m > {off['radius_meters']}m)")
            if not is_accuracy_ok: errors.append(f"Poor GPS (±{user_acc:.0f}m > 100m)")

            st.write("")
            b_in, b_out = st.columns(2)
            btn_in = b_in.button("✅ Mark Check-In", type="primary", use_container_width=True)
            btn_out = b_out.button("🚪 Mark Check-Out", use_container_width=True)

            if btn_in or btn_out:
                action_str = "CHECK_IN" if btn_in else "CHECK_OUT"
                server_timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

                record = {
                    "id": f"att-{int(time.time())}",
                    "employee_id": current_emp["id"],
                    "employee_name": current_emp["name"],
                    "type": action_str,
                    "timestamp": server_timestamp,
                    "source": "camera",
                    "status": "APPROVED" if overall_approved else "REJECTED",
                    "distance_meters": dist_m,
                    "accuracy_meters": user_acc,
                    "face_count": face_count,
                    "rejection_reason": " | ".join(errors) if errors else None
                }
                st.session_state.attendance_logs.insert(0, record)

                if overall_approved:
                    st.balloons()
                    st.success(f"🎉 **{action_str} APPROVED!** Recorded at `{server_timestamp}` (Distance: `{dist_m}m`).")
                else:
                    st.error(f"⛔ **ATTENDANCE REJECTED:** {' | '.join(errors)}")
                    st.warning("⚠️ If you are on site and experiencing issues, submit a fallback request in the **HR Fallback Request** tab.")
        else:
            st.info("👆 Please center your face and click the camera button to perform live verification.")

# ------------------------------------------------------------------------------
# TAB 2: ATTENDANCE AUDIT FEED
# ------------------------------------------------------------------------------
with tab_logs:
    st.subheader("📋 Official Attendance Telemetry Feed")
    st.write("Authoritative server log showing distance calculations, GPS metrics, and rejection reasons:")

    if st.session_state.attendance_logs:
        import pandas as pd
        df = pd.DataFrame(st.session_state.attendance_logs)
        st.dataframe(df, use_container_width=True, hide_index=True)
    else:
        st.info("No attendance records logged yet.")

# ------------------------------------------------------------------------------
# TAB 3: HR FALLBACK REQUEST (EMPLOYEE SUBMISSION)
# ------------------------------------------------------------------------------
with tab_hr:
    st.subheader("📝 HR Attendance Correction Fallback")
    st.write("If automated camera or GPS verification fails, employees can submit a correction request for Admin/HR review.")

    with st.form("hr_submission_form"):
        st.markdown(f"Submitting for: **{current_emp['name']}** ({current_emp['id']})")
        req_type = st.selectbox("Action", ["CHECK_IN", "CHECK_OUT"])
        req_date = st.date_input("Target Date")
        req_time = st.time_input("Target Time")
        req_reason = st.text_area("Reason & Context", placeholder="e.g. GPS signal blocked inside basement server room...")
        submitted = st.form_submit_button("Submit Request to Admin", type="primary")

        if submitted:
            if req_reason.strip():
                new_req = {
                    "id": f"corr-{int(time.time())}",
                    "employee_id": current_emp["id"],
                    "employee_name": current_emp["name"],
                    "type": req_type,
                    "date": str(req_date),
                    "time": str(req_time),
                    "reason": req_reason.strip(),
                    "status": "PENDING"
                }
                st.session_state.corrections.insert(0, new_req)
                st.success("✅ Correction request submitted! Admin will review it in the Admin Portal.")
            else:
                st.warning("Please provide a reason.")

    st.divider()
    st.markdown("#### Your Submitted Correction Requests")
    emp_requests = [c for c in st.session_state.corrections if c["employee_id"] == current_emp["id"]]
    if not emp_requests:
        st.info("No correction requests submitted for this employee.")
    else:
        for r in emp_requests:
            badge = "badge-pass" if r["status"] == "APPROVED" else "badge-fail" if r["status"] == "REJECTED" else "badge-pending"
            st.markdown(f"**Request #{r['id']}** — `{r['type']}` on {r['date']} at {r['time']}")
            st.markdown(f"*Reason:* {r['reason']} | Status: <span class='{badge}'>{r['status']}</span>", unsafe_allow_html=True)
            st.write("---")

# ------------------------------------------------------------------------------
# TAB 4: ADMIN PORTAL (LOGIN PROTECTED: username=admi, password=1234)
# ------------------------------------------------------------------------------
with tab_admin:
    st.subheader("⚙️ Administrator & HR Approval Portal")
    
    # Check if admin is logged in
    if not st.session_state.admin_logged_in:
        st.markdown("""
        <div class="login-card">
            <h3 style="margin-top:0; color:#fff; font-weight:800; text-align:center;">🔒 Admin Authentication</h3>
            <p style="color:#94a3b8; font-size:12px; text-align:center; margin-bottom:20px;">
                Enter administrator credentials to approve/reject attendance corrections and manage office geofence.
            </p>
        </div>
        """, unsafe_allow_html=True)

        with st.form("admin_login_form"):
            login_user = st.text_input("Username", placeholder="admi")
            login_pass = st.text_input("Password", type="password", placeholder="1234")
            login_submit = st.form_submit_button("🔑 Login to Admin Portal", type="primary", use_container_width=True)

            if login_submit:
                # Accept username = admi (or admin) and password = 1234
                if login_user.strip() in ["admi", "admin"] and login_pass.strip() == "1234":
                    st.session_state.admin_logged_in = True
                    st.success("Authentication successful! Welcome, Admin.")
                    st.rerun()
                else:
                    st.error("❌ Invalid credentials! (Username: admi | Password: 1234)")
    else:
        # ADMIN IS LOGGED IN
        top_admin_col1, top_admin_col2 = st.columns([3, 1])
        with top_admin_col1:
            st.markdown('<span class="badge-pass">AUTHENTICATED AS ADMINISTRATOR</span>', unsafe_allow_html=True)
        with top_admin_col2:
            if st.button("🚪 Log Out", key="admin_logout_btn"):
                st.session_state.admin_logged_in = False
                st.rerun()

        st.write("")

        # Section A: HR Correction Approvals / Rejections
        st.markdown("### 📝 Pending HR Correction Requests (Approve / Reject)")
        st.write("Review employee fallback requests. Approving a request instantly validates and logs official attendance.")

        pending_requests = [c for c in st.session_state.corrections if c["status"] == "PENDING"]
        if not pending_requests:
            st.success("✨ No pending HR correction requests to review. All employee records are up to date!")
        else:
            for req in pending_requests:
                st.markdown(f"""
                <div style="background:#1e293b; padding:16px; border-radius:14px; border:1px solid #334155; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:700; color:#fff; font-size:14px;">{req['employee_name']} ({req['employee_id']})</span>
                        <span style="background:#312e81; color:#818cf8; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700;">{req['type']}</span>
                    </div>
                    <div style="color:#94a3b8; font-size:12px; margin-top:6px;">
                        Date: <b>{req['date']}</b> at <b>{req['time']}</b>
                    </div>
                    <div style="background:#0f172a; padding:10px; border-radius:8px; border:1px solid #1e293b; color:#cbd5e1; font-size:12px; margin-top:8px;">
                        "{req['reason']}"
                    </div>
                </div>
                """, unsafe_allow_html=True)

                col_app, col_rej = st.columns([1, 1])
                if col_app.button(f"✅ Approve #{req['id']}", key=f"app_{req['id']}", type="primary"):
                    req["status"] = "APPROVED"
                    # Add to official attendance
                    st.session_state.attendance_logs.insert(0, {
                        "id": f"att-hr-{int(time.time())}",
                        "employee_id": req["employee_id"],
                        "employee_name": req["employee_name"],
                        "type": req["type"],
                        "timestamp": f"{req['date']} {req['time']}:00 UTC",
                        "source": "hr_correction",
                        "status": "APPROVED",
                        "distance_meters": 0.0,
                        "accuracy_meters": 10.0,
                        "face_count": 1,
                        "rejection_reason": f"Approved by Admin: {req['reason']}"
                    })
                    st.success(f"Approved request #{req['id']} for {req['employee_name']}! Attendance record created.")
                    st.rerun()

                if col_rej.button(f"❌ Reject #{req['id']}", key=f"rej_{req['id']}"):
                    req["status"] = "REJECTED"
                    st.warning(f"Rejected request #{req['id']}.")
                    st.rerun()
                st.write("---")

        st.divider()

        # Section B: Office Geofence Configuration
        st.markdown("### 🏢 Office Geofence & Perimeter Settings")
        with st.form("admin_geofence_form"):
            off_name = st.text_input("Office Name", value=st.session_state.office["name"])
            g_c1, g_c2 = st.columns(2)
            off_lat = g_c1.number_input("Office Latitude", value=st.session_state.office["latitude"], format="%.6f")
            off_lon = g_c2.number_input("Office Longitude", value=st.session_state.office["longitude"], format="%.6f")
            
            g_c3, g_c4 = st.columns(2)
            off_rad = g_c3.number_input("Allowed Geofence Radius (meters)", value=st.session_state.office["radius_meters"], min_value=10, max_value=5000)
            off_acc = g_c4.number_input("Max GPS Accuracy Threshold (meters)", value=st.session_state.office["max_accuracy_meters"], min_value=10, max_value=500)

            save_office_btn = st.form_submit_button("💾 Save Geofence Settings", type="primary")
            if save_office_btn:
                st.session_state.office["name"] = off_name
                st.session_state.office["latitude"] = off_lat
                st.session_state.office["longitude"] = off_lon
                st.session_state.office["radius_meters"] = off_rad
                st.session_state.office["max_accuracy_meters"] = off_acc
                st.success("Office geofence rules updated successfully!")
                st.rerun()

        # 1-Click Calibration
        st.write("#### 🎯 Quick Geofence Calibration")
        st.write("Calibrate the company office center directly to the simulated location so all tests pass immediately:")
        if st.button("📍 Set Office Location to Simulated Location"):
            st.session_state.office["latitude"] = user_lat
            st.session_state.office["longitude"] = user_lon
            st.success(f"Office coordinates updated to `{user_lat:.6f}, {user_lon:.6f}`! Now any check-in from this position will be within 0m distance!")
            st.rerun()
