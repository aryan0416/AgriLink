import torch
import os
from torchvision import models

def main():
    os.makedirs('ml_models', exist_ok=True)
    
    # Download pre-trained MobileNetV2
    model = models.mobilenet_v2(pretrained=True)
    
    # Replace classifier head to match our 4 output classes (grade + 3 defects)
    model.classifier[1] = torch.nn.Linear(model.last_channel, 4)
    
    # Save the modified model
    model_path = 'ml_models/produce_quality_model.pth'
    torch.save(model.state_dict(), model_path)
    print(f'Dummy pre-built model saved to {model_path}')

if __name__ == '__main__':
    main()
