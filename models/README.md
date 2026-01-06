# Download yield estimation models from Colab

Place these files in this folder:

1. simclr_encoder_a100.pt     (~50MB)
2. ranking_model_a100.pt      (~50MB)

## How to download from Colab:

1. Open your Colab notebook: train_yield_estimation_simclr_a100.ipynb

2. Scroll to the bottom and run these cells:
   - Cell 31: "Model Summary" (creates metadata)
   - Cell 32: "Auto-Download Models" (downloads to your computer)

3. Move files from Downloads:
   ```bash
   mv ~/Downloads/simclr_encoder_a100.pt .
   mv ~/Downloads/ranking_model_a100.pt .
   ```

## Without these models:

The backend will still work using fallback morphology-based estimation (less accurate).

## With these models:

The backend will use your trained ML models for accurate yield prediction!
