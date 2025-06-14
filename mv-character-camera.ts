import { ChangeImpl_RemoveTargetTracksFromTimeline, CharModelList_LogIndexAndCharName, 
    SetActiveOfDeactivateTargets, ChangeImpl_ForceDisableCameraDecoration,
    GetCharacterNameFromCharacterModel, isThirdPersonEnabled, GetCharacterModelListFromMVModel, GetMVModelInstance,
    GetTargetTransformOfCharModelToAttach, GetMainCamFromMVCameraModel, ChangeImpl_CreateOpenOptionDialogButton,
    ChangeImpl_ChangeFOV} from "./lib/mv-utils.js";
import { AssemblyImage, Vector3 } from "./lib/consts.js";
import { GetFromProperty, GetTransform, SetParent, SetProperty } from "./lib/lib.js";

let targetCharIndex = 0

Il2Cpp.perform(() => {
    ChangeImpl_RemoveTargetTracksFromTimeline()
    ChangeImpl_ForceDisableCameraDecoration()
    ChangeImpl_ChangeFOV()
    ChangeImpl_CreateOpenOptionDialogButton()

    AssemblyImage.class("Sekai.Live.Model.MusicVideoModel").method("RegisterMainCharacterModel").implementation = function(characterModel: Il2Cpp.Object)
    {
        this.method("RegisterMainCharacterModel").invoke(characterModel)

        const characterList: Il2Cpp.Array<Il2Cpp.Object> = GetFromProperty(characterModel, "CharacterModelList")
        CharModelList_LogIndexAndCharName(characterList)
    
        if(targetCharIndex > characterList.length - 1)
        {
            console.log("targetCharIndex exceeds the range of characterList, setting to 0")
            targetCharIndex = 0
        }

        console.log(`Currently the target index is set to ${targetCharIndex} | ${GetCharacterNameFromCharacterModel(characterList.get(targetCharIndex))}`)
    }

    AssemblyImage.class("Sekai.Core.Live.MusicVideoController").method("Start").implementation = function()
    {
        this.method("Start").invoke()

        const mvModelInstance = GetMVModelInstance()
        const mainCam = GetMainCamFromMVCameraModel(GetFromProperty(mvModelInstance, "MainCameraModel"))
        const mainCamTransform = GetTransform(mainCam)
        const characterModelList = GetCharacterModelListFromMVModel(mvModelInstance)

        const targetCharacter = characterModelList.get(targetCharIndex)
        SetParent(mainCamTransform, GetTargetTransformOfCharModelToAttach(targetCharacter))
        SetActiveOfDeactivateTargets(targetCharacter, false)

        const newAngles = Vector3.alloc()
        if(isThirdPersonEnabled)
        {
            newAngles.method(".ctor").invoke(180.0, 0.0, 180.0)
        } else {
            newAngles.method(".ctor").invoke(0.0, 0.0, 90.0) // Fixing the camera tilt caused when changing the parent. Not sure why it tilts
        }
        SetProperty(mainCamTransform, "localEulerAngles", newAngles.unbox())

        const newLocalPos = Vector3.alloc()
        if(isThirdPersonEnabled)
        {
            newLocalPos.method(".ctor").invoke(0.0, 0.6, 1.5)
        } else {
            newLocalPos.method(".ctor").invoke(-0.07, 0.0, 0.005)
        }
        SetProperty(mainCamTransform, "localPosition", newLocalPos.unbox())
    }
    
    // Implementation of switching target by back button in Android
    AssemblyImage.class("Sekai.Core.Live.MusicVideoController").method("OnBackKey").implementation = function()
    {
        const mvModelInstance = GetMVModelInstance()
        const mainCam = GetMainCamFromMVCameraModel(GetFromProperty(mvModelInstance, "MainCameraModel"))
        const mainCamTransform = GetTransform(mainCam)
        const characterModelList = GetCharacterModelListFromMVModel(mvModelInstance)

        // Reactivate the elements of character deactivated before
        SetActiveOfDeactivateTargets(characterModelList.get(targetCharIndex), true)
    
        // Increment targetCharIndex, set to 0 if it exceeds the range of CharacterModelArray
        targetCharIndex = targetCharIndex >= characterModelList.length - 1 ? 0 : targetCharIndex + 1
    
        const newTargetCharacterModel = characterModelList.get(targetCharIndex)

        console.log(`Set target index to ${targetCharIndex} | ${GetCharacterNameFromCharacterModel(newTargetCharacterModel)}`)
        
        SetParent(mainCamTransform, GetTargetTransformOfCharModelToAttach(newTargetCharacterModel))
        SetActiveOfDeactivateTargets(newTargetCharacterModel, false)
    }
})