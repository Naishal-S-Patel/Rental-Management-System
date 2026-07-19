# RentLo — Rental Management System

RentLo is a modern, peer-to-peer and marketplace rental platform rebuilt to deliver a warm, trust-oriented, premium user experience. This repository contains the complete customer portal frontend redesigned from scratch.

---

## 🌟 RentLo Redesign Highlights

We overhauled the generic rental layout into a premium, tactile booking application:

1. **Brand Identity & Design System**:
   - Rebranded the platform as **RentLo** across logo elements, layouts, and page titles.
   - Built a dynamic color palette centered around **Sunset Coral** (`#FF385C`), charcoal, and warm teal accents.
   - Applied hierarchical border-radius mappings (tighter for inputs/pills, organic and generous for cards/hero highlights).
   - Structured typography imports (`Sora` for headings, `Outfit` for body copy, and `Caveat` for annotations).

2. **Engaging Marketing Landing Page (`/`)**:
   - **Hand-Drawn Annotations**: Integrated SVG marker highlights behind "RentLo" and natural, organic underlines to reinforce a trust-based feel.
   - **Asymmetric Hero Gallery**: Arranged rental category products (MacBook Pro, DSLR Camera, Soft armchair) in a floating, tilted visual collage.
   - **Shayari Buzz Ticker**: Added a sliding marquee in the sub-hero that displays localized rental buzz messages.
   - **Organic Connected Flow**: Placed handwritten annotations and organic SVG loops guiding users from search straight into category tabs.

3. **Intelligent Browse Gear (`/products`)**:
   - **Sparse Results Layout**: Grid containers automatically adjust maximum width and center results dynamically when filtered results are sparse (1 or 2 products).
   - **Explore Recommendation Deck**: Displays product recommendations from other categories to encourage browsing rather than displaying blank states.
   - **View Cart Alignment**: Fixed formatting to ensure the cart view action is perfectly aligned with the grid without clipping.

4. **Detailed Product Experience & Reviews**:
   - **Ratings & Reviews**: Added a dedicated reviews tab inside the product detail view to list customer feedback.
   - **Submit Reviews**: Customers can rate and review completed items instantly using a custom popup rating modal.

5. **Connected Timeline Progress Stepper**:
   - Rebuilt the order progress tracker into a real connected stepper with clean timeline node lines and status color shifts.
   - Designed responsive summary cards highlighting Rented Items, Invoices, and Security Deposit details.

6. **Account & Settings Panel**:
   - Redesigned profile page into a sidebar tab structure: Profile Details, Saved Addresses (in neutral styled cards), and Password Security.
   - Supports persistent profile image uploads and real-time validation alerts.

---

## 🚀 Running the Frontend

To start the Vite development server for the frontend portal:

```bash
cd Frontend/frontend
npm install
npm run dev
```

The portal will run at [http://localhost:5173/](http://localhost:5173/).

---

## ⚙️ Backend Integration (Optional)

The backend starter services remain supported:

```bash
cd Backend/starter
.\mvnw.cmd spring-boot:run
```
